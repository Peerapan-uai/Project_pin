const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const generatePayload = require('promptpay-qr');
const QRCode = require('qrcode');

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment endpoints
 */

// ─────────────────────────────────────────────
// WEBHOOK ROUTES  (ต้องอยู่บนสุด ก่อน /:id)
// ─────────────────────────────────────────────

/**
 * @swagger
 * /api/payments/webhook/omise:
 *   post:
 *     summary: Receive Omise webhook (card charge success/fail)
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Webhook received
 */
// #42  POST /webhook/omise
router.post('/webhook/omise', async (req, res) => {
  try {
    const event = req.body;
    console.log('[Omise Webhook]', JSON.stringify(event));

    // TODO: ตรวจ signature จาก Omise ก่อน production
    // event.key === 'charge.complete' → update payment status
    if (event && event.key === 'charge.complete') {
      const charge = event.data;
      const ref = charge && charge.metadata && charge.metadata.transaction_ref;
      if (ref) {
        const status = charge.status === 'successful' ? 'completed' : 'failed';
        await pool.query(
          `UPDATE payments SET status = ?, paid_at = IF(? = 'completed', NOW(), paid_at) WHERE transaction_ref = ?`,
          [status, status, ref]
        );
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Omise webhook error:', error);
    return res.status(200).json({ received: true }); // always 200 to Omise
  }
});

/**
 * @swagger
 * /api/payments/webhook/promptpay:
 *   post:
 *     summary: Receive PromptPay/bank webhook (QR transfer success)
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Webhook received
 */
// #43  POST /webhook/promptpay
router.post('/webhook/promptpay', async (req, res) => {
  try {
    const payload = req.body;
    console.log('[PromptPay Webhook]', JSON.stringify(payload));

    // TODO: ตรวจ signature/secret จากธนาคารก่อน production
    const ref = payload && (payload.transaction_ref || payload.ref);
    if (ref) {
      await pool.query(
        `UPDATE payments SET status = 'completed', paid_at = NOW() WHERE transaction_ref = ? AND status = 'pending'`,
        [ref]
      );
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('PromptPay webhook error:', error);
    return res.status(200).json({ received: true });
  }
});

// ─────────────────────────────────────────────
// STATIC / NAMED ROUTES  (ก่อน /:id ทั้งหมด)
// ─────────────────────────────────────────────

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Create a payment record for a completed session
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [session_id, amount, method]
 *             properties:
 *               session_id:
 *                 type: integer
 *               amount:
 *                 type: number
 *               method:
 *                 type: string
 *                 enum: [credit_card, promptpay, wallet]
 *     responses:
 *       201:
 *         description: Payment recorded
 *       400:
 *         description: Missing fields or session invalid
 *       500:
 *         description: Server error
 */
// #35  POST /  — nem
router.post('/', auth, async (req, res) => {
  const { session_id, amount, method } = req.body;

  if (!session_id || !amount || !method) {
    return res.status(400).json({ message: 'session_id, amount, and method are required.' });
  }

  try {
    const [sessionRows] = await pool.query(
      `SELECT * FROM charging_sessions WHERE session_id = ? AND user_id = ? AND status = 'completed'`,
      [session_id, req.user.user_id]
    );

    if (sessionRows.length === 0) {
      return res.status(400).json({ message: 'No completed session found for this user.' });
    }

    const [existingPayment] = await pool.query(
      'SELECT payment_id FROM payments WHERE session_id = ?',
      [session_id]
    );

    if (existingPayment.length > 0) {
      return res.status(400).json({ message: 'Payment already recorded for this session.' });
    }

    const transaction_ref = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const [result] = await pool.query(
      `INSERT INTO payments (user_id, session_id, amount, method, status, transaction_ref, paid_at)
       VALUES (?, ?, ?, ?, 'completed', ?, NOW())`,
      [req.user.user_id, session_id, amount, method, transaction_ref]
    );

    try {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'payment')`,
        [req.user.user_id, 'ชำระเงินสำเร็จ', `ชำระเงินจำนวน ${amount} บาท เรียบร้อยแล้ว เลขอ้างอิง: ${transaction_ref}`]
      );
    } catch (_) {}

    return res.status(201).json({
      message: 'Payment recorded successfully.',
      payment_id: result.insertId,
      transaction_ref,
    });
  } catch (error) {
    console.error('Create payment error:', error);
    return res.status(500).json({ message: 'Server error recording payment.' });
  }
});

/**
 * @swagger
 * /api/payments/qr:
 *   post:
 *     summary: Generate PromptPay QR Code for payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [session_id, amount]
 *             properties:
 *               session_id:
 *                 type: integer
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: QR data returned
 *       400:
 *         description: Missing fields or invalid session
 *       500:
 *         description: Server error
 */
// #38  POST /qr  — nem
router.post('/qr', auth, async (req, res) => {
  const { session_id, amount } = req.body;

  if (!session_id || !amount) {
    return res.status(400).json({ message: 'session_id and amount are required.' });
  }

  try {
    const [sessionRows] = await pool.query(
      `SELECT * FROM charging_sessions WHERE session_id = ? AND user_id = ? AND status = 'completed'`,
      [session_id, req.user.user_id]
    );

    if (sessionRows.length === 0) {
      return res.status(400).json({ message: 'No completed session found for this user.' });
    }

    const [existingPayment] = await pool.query(
      'SELECT payment_id FROM payments WHERE session_id = ?',
      [session_id]
    );

    if (existingPayment.length > 0) {
      return res.status(400).json({ message: 'Payment already recorded for this session.' });
    }

    const transaction_ref = `QR${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // สร้าง payment record สถานะ pending รอ user confirm
    const [result] = await pool.query(
      `INSERT INTO payments (user_id, session_id, amount, method, status, transaction_ref)
       VALUES (?, ?, ?, 'promptpay', 'pending', ?)`,
      [req.user.user_id, session_id, amount, transaction_ref]
    );

    // สร้าง PromptPay QR จริงด้วย promptpay-qr + qrcode
    const promptpayId = process.env.PROMPTPAY_ID || '0812345678';
    const roundedAmount = Math.round(Number(amount) * 100) / 100;
    const qr_payload = generatePayload(promptpayId, { amount: roundedAmount });
    const qr_image = await QRCode.toDataURL(qr_payload, { width: 300, margin: 2 });

    return res.status(200).json({
      message: 'PromptPay QR generated. Scan to pay.',
      payment_id: result.insertId,
      transaction_ref,
      amount: roundedAmount,
      qr_payload,
      qr_image, // data:image/png;base64,...
      expires_in: 900, // 15 นาที
    });
  } catch (error) {
    console.error('Generate QR error:', error);
    return res.status(500).json({ message: 'Server error generating QR.' });
  }
});

/**
 * @swagger
 * /api/payments/charge:
 *   post:
 *     summary: Pay with credit/debit card via Omise
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [session_id, amount, token]
 *             properties:
 *               session_id:
 *                 type: integer
 *               amount:
 *                 type: number
 *               token:
 *                 type: string
 *                 description: Omise card token from Omise.js
 *     responses:
 *       200:
 *         description: Charge successful
 *       400:
 *         description: Charge failed or invalid input
 *       500:
 *         description: Server error
 */
// #39  POST /charge  — nem
router.post('/charge', auth, async (req, res) => {
  const { session_id, amount, token } = req.body;

  if (!session_id || !amount || !token) {
    return res.status(400).json({ message: 'session_id, amount, and token are required.' });
  }

  try {
    const [sessionRows] = await pool.query(
      `SELECT * FROM charging_sessions WHERE session_id = ? AND user_id = ? AND status = 'completed'`,
      [session_id, req.user.user_id]
    );

    if (sessionRows.length === 0) {
      return res.status(400).json({ message: 'No completed session found for this user.' });
    }

    const [existingPayment] = await pool.query(
      'SELECT payment_id FROM payments WHERE session_id = ?',
      [session_id]
    );

    if (existingPayment.length > 0) {
      return res.status(400).json({ message: 'Payment already recorded for this session.' });
    }

    const transaction_ref = `CARD${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Omise charge (server-side only — token มาจาก Omise.js บน frontend)
    const Omise = require('omise')({ secretKey: process.env.OMISE_SECRET_KEY });
    let chargeStatus = 'failed';
    let omiseChargeId = null;
    try {
      const charge = await Omise.charges.create({
        amount: Math.round(Number(amount) * 100), // หน่วย: สตางค์
        currency: 'thb',
        card: token,
        metadata: { transaction_ref },
      });
      omiseChargeId = charge.id;
      chargeStatus = charge.status === 'successful' ? 'completed' : 'failed';
    } catch (omiseErr) {
      console.error('[Omise] charge error:', omiseErr.message);
      chargeStatus = 'failed';
    }

    const [result] = await pool.query(
      `INSERT INTO payments (user_id, session_id, amount, method, status, transaction_ref, paid_at)
       VALUES (?, ?, ?, 'credit_card', ?, ?, IF(? = 'completed', NOW(), NULL))`,
      [req.user.user_id, session_id, amount, chargeStatus, transaction_ref, chargeStatus]
    );

    if (chargeStatus !== 'completed') {
      return res.status(400).json({
        message: 'Card charge failed. Please try again.',
        payment_id: result.insertId,
        transaction_ref,
      });
    }

    return res.status(200).json({
      message: 'Card charge successful.',
      payment_id: result.insertId,
      transaction_ref,
      omise_charge_id: omiseChargeId,
      amount,
    });
  } catch (error) {
    console.error('Card charge error:', error);
    return res.status(500).json({ message: 'Server error processing card charge.' });
  }
});

/**
 * @swagger
 * /api/payments/history:
 *   get:
 *     summary: Get payment history for the authenticated user
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of payments
 *       500:
 *         description: Server error
 */
// #36  GET /history  — nem
router.get('/history', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, s.start_time AS session_start, s.end_time AS session_end,
              s.energy_kwh, st.name AS station_name
       FROM payments p
       JOIN charging_sessions s ON p.session_id = s.session_id
       JOIN chargers c ON s.charger_id = c.charger_id
       JOIN stations st ON c.station_id = st.station_id
       WHERE p.user_id = ?
       ORDER BY p.paid_at DESC`,
      [req.user.user_id]
    );

    return res.status(200).json({ payments: rows });
  } catch (error) {
    console.error('Get payment history error:', error);
    return res.status(500).json({ message: 'Server error fetching payment history.' });
  }
});

/**
 * @swagger
 * /api/payments/admin/all:
 *   get:
 *     summary: Get all payments (Admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all payments
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
// #44  GET /admin/all  — lalla
router.get('/admin/all', auth, roleCheck('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.payment_id, p.amount, p.method, p.status, p.paid_at, p.transaction_ref,
              u.first_name, u.last_name,
              s.energy_kwh, st.name AS station_name, c.charger_name
       FROM payments p
       JOIN users u ON p.user_id = u.user_id
       JOIN charging_sessions s ON p.session_id = s.session_id
       JOIN chargers c ON s.charger_id = c.charger_id
       JOIN stations st ON c.station_id = st.station_id
       ORDER BY p.paid_at DESC`
    );
    return res.status(200).json({ payments: rows });
  } catch (error) {
    console.error('Get all payments error:', error);
    return res.status(500).json({ message: 'Server error fetching payments.' });
  }
});

/**
 * @swagger
 * /api/payments/admin/{id}:
 *   get:
 *     summary: Get a single payment by ID (Admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payment data
 *       403:
 *         description: Access denied
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
// #45  GET /admin/:id  — nem
router.get('/admin/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, u.first_name, u.last_name, u.email,
              s.start_time AS session_start, s.end_time AS session_end, s.energy_kwh,
              c.charger_name, c.connector_type, c.power_kw,
              st.name AS station_name, st.address AS station_address
       FROM payments p
       JOIN users u ON p.user_id = u.user_id
       JOIN charging_sessions s ON p.session_id = s.session_id
       JOIN chargers c ON s.charger_id = c.charger_id
       JOIN stations st ON c.station_id = st.station_id
       WHERE p.payment_id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    return res.status(200).json({ payment: rows[0] });
  } catch (error) {
    console.error('Admin get payment error:', error);
    return res.status(500).json({ message: 'Server error fetching payment.' });
  }
});

// ─────────────────────────────────────────────
// PARAMETERIZED ROUTES  /:id  (ต้องอยู่ท้ายสุด)
// ─────────────────────────────────────────────

/**
 * @swagger
 * /api/payments/{id}/confirm:
 *   patch:
 *     summary: User confirms PromptPay QR has been scanned and paid
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payment confirmed
 *       400:
 *         description: Payment not pending
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
// #40  PATCH /:id/confirm  — nem
router.patch('/:id/confirm', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM payments WHERE payment_id = ? AND user_id = ?`,
      [req.params.id, req.user.user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    if (rows[0].status !== 'pending') {
      return res.status(400).json({ message: `Payment is already ${rows[0].status}.` });
    }

    await pool.query(
      `UPDATE payments SET status = 'completed', paid_at = NOW() WHERE payment_id = ?`,
      [req.params.id]
    );

    return res.status(200).json({ message: 'Payment confirmed successfully.' });
  } catch (error) {
    console.error('Confirm payment error:', error);
    return res.status(500).json({ message: 'Server error confirming payment.' });
  }
});

/**
 * @swagger
 * /api/payments/{id}/status:
 *   get:
 *     summary: Check payment status
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payment status
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
// #41  GET /:id/status  — nem
router.get('/:id/status', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT payment_id, status, method, amount, transaction_ref, paid_at
       FROM payments
       WHERE payment_id = ? AND user_id = ?`,
      [req.params.id, req.user.user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    return res.status(200).json({ payment_id: rows[0].payment_id, status: rows[0].status, ...rows[0] });
  } catch (error) {
    console.error('Get payment status error:', error);
    return res.status(500).json({ message: 'Server error fetching payment status.' });
  }
});

/**
 * @swagger
 * /api/payments/{id}/refund:
 *   post:
 *     summary: Refund a payment (Admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Partial refund amount (default = full amount)
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund processed
 *       400:
 *         description: Payment not eligible for refund
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
// #46  POST /:id/refund  — nem
router.post('/:id/refund', auth, roleCheck('admin'), async (req, res) => {
  const { reason } = req.body;

  try {
    const [rows] = await pool.query(
      `SELECT * FROM payments WHERE payment_id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    if (rows[0].status !== 'completed') {
      return res.status(400).json({ message: 'Only completed payments can be refunded.' });
    }

    const refundAmount = req.body.amount || rows[0].amount;

    if (refundAmount > rows[0].amount) {
      return res.status(400).json({ message: 'Refund amount cannot exceed original payment.' });
    }

    // TODO: เรียก Omise refund API จริงก่อน production
    // await Omise.charges.createRefund(charge_id, { amount: Math.round(refundAmount * 100) });

    await pool.query(
      `UPDATE payments SET status = 'refunded' WHERE payment_id = ?`,
      [req.params.id]
    );

    const [refundResult] = await pool.query(
      `INSERT INTO payment_refunds (payment_id, amount, reason, refunded_by) VALUES (?, ?, ?, ?)`,
      [req.params.id, refundAmount, reason || null, req.user.user_id]
    );

    // ถ้าจ่ายด้วย wallet → คืนเงินเข้า wallet
    if (rows[0].method === 'wallet') {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        await conn.query(
          'UPDATE users SET wallet_balance = wallet_balance + ? WHERE user_id = ?',
          [refundAmount, rows[0].user_id]
        );
        await conn.query(
          `INSERT INTO wallet_transactions (user_id, amount, type, ref) VALUES (?, ?, 'refund', ?)`,
          [rows[0].user_id, refundAmount, `refund_payment_${req.params.id}`]
        );
        await conn.commit();
      } catch (walletErr) {
        await conn.rollback();
        console.warn('Wallet refund failed:', walletErr.message);
      } finally {
        conn.release();
      }
    }

    return res.status(200).json({
      message: 'Refund processed successfully.',
      refund_id: refundResult.insertId,
      payment_id: Number(req.params.id),
      refund_amount: refundAmount,
      wallet_refunded: rows[0].method === 'wallet',
    });
  } catch (error) {
    console.error('Refund error:', error);
    return res.status(500).json({ message: 'Server error processing refund.' });
  }
});

/**
 * @swagger
 * /api/payments/{id}/refunds:
 *   get:
 *     summary: Get refund history for a payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of refunds
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
// #47  GET /:id/refunds  — nem
router.get('/:id/refunds', auth, async (req, res) => {
  try {
    const [paymentRows] = await pool.query(
      `SELECT payment_id FROM payments WHERE payment_id = ? AND user_id = ?`,
      [req.params.id, req.user.user_id]
    );

    // admin สามารถดูได้ทุก payment
    let payment;
    if (paymentRows.length === 0) {
      if (req.user.role !== 'admin') {
        return res.status(404).json({ message: 'Payment not found.' });
      }
      const [adminRows] = await pool.query(
        `SELECT payment_id FROM payments WHERE payment_id = ?`,
        [req.params.id]
      );
      if (adminRows.length === 0) {
        return res.status(404).json({ message: 'Payment not found.' });
      }
      payment = adminRows[0];
    } else {
      payment = paymentRows[0];
    }

    const [refunds] = await pool.query(
      `SELECT r.*, CONCAT(u.first_name, ' ', u.last_name) AS refunded_by_name
       FROM payment_refunds r
       JOIN users u ON r.refunded_by = u.user_id
       WHERE r.payment_id = ?
       ORDER BY r.refunded_at DESC`,
      [req.params.id]
    );

    return res.status(200).json({ payment_id: Number(req.params.id), refunds });
  } catch (error) {
    console.error('Get refunds error:', error);
    return res.status(500).json({ message: 'Server error fetching refunds.' });
  }
});

/**
 * @swagger
 * /api/payments/{id}/cancel:
 *   delete:
 *     summary: Cancel a pending payment (Admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payment cancelled
 *       400:
 *         description: Payment is not pending
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
// #48  DELETE /:id/cancel  — nem
router.delete('/:id/cancel', auth, roleCheck('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM payments WHERE payment_id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    if (rows[0].status !== 'pending') {
      return res.status(400).json({ message: `Cannot cancel a ${rows[0].status} payment.` });
    }

    await pool.query(
      `UPDATE payments SET status = 'failed' WHERE payment_id = ?`,
      [req.params.id]
    );

    return res.status(200).json({ message: 'Payment cancelled successfully.' });
  } catch (error) {
    console.error('Cancel payment error:', error);
    return res.status(500).json({ message: 'Server error cancelling payment.' });
  }
});

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Get a specific payment by ID (current user)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payment data
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
// #37  GET /:id  — nem  (ต้องอยู่ล่างสุดใน /:id group)
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, s.start_time AS session_start, s.end_time AS session_end,
              s.energy_kwh, c.connector_type, c.power_kw, st.name AS station_name
       FROM payments p
       JOIN charging_sessions s ON p.session_id = s.session_id
       JOIN chargers c ON s.charger_id = c.charger_id
       JOIN stations st ON c.station_id = st.station_id
       WHERE p.payment_id = ? AND p.user_id = ?`,
      [req.params.id, req.user.user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    return res.status(200).json({ payment: rows[0] });
  } catch (error) {
    console.error('Get payment error:', error);
    return res.status(500).json({ message: 'Server error fetching payment.' });
  }
});

module.exports = router;
