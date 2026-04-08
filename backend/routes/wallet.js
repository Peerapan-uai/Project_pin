const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const generatePayload = require('promptpay-qr');
const QRCode = require('qrcode');

/**
 * @swagger
 * tags:
 *   name: Wallet
 *   description: Wallet endpoints (topup, balance, deduct)
 */

/**
 * @swagger
 * /api/wallet/balance:
 *   get:
 *     summary: Get current wallet balance
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance
 *       500:
 *         description: Server error
 */
router.get('/balance', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT wallet_balance FROM users WHERE user_id = ?',
      [req.user.user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const [txns] = await pool.query(
      `SELECT txn_id, amount, type, ref, created_at
       FROM wallet_transactions
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [req.user.user_id]
    );

    return res.status(200).json({
      balance: rows[0].wallet_balance,
      recent_transactions: txns,
    });
  } catch (error) {
    console.error('Get wallet balance error:', error);
    return res.status(500).json({ message: 'Server error fetching balance.' });
  }
});

/**
 * @swagger
 * /api/wallet/topup:
 *   post:
 *     summary: Top up wallet (via PromptPay QR or credit card)
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, method]
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount to top up (min 20 baht)
 *               method:
 *                 type: string
 *                 enum: [promptpay, credit_card]
 *               token:
 *                 type: string
 *                 description: Omise token (required for credit_card)
 *     responses:
 *       200:
 *         description: Top up successful
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/topup', auth, async (req, res) => {
  const { amount, method, token } = req.body;

  if (!amount || !method) {
    return res.status(400).json({ message: 'amount and method are required.' });
  }

  if (amount < 20) {
    return res.status(400).json({ message: 'Minimum top up is 20 baht.' });
  }

  if (method === 'credit_card' && !token) {
    return res.status(400).json({ message: 'Omise token is required for credit card.' });
  }

  // เช็ค wallet_frozen
  const [frozenCheck] = await pool.query(
    'SELECT wallet_frozen FROM users WHERE user_id = ?',
    [req.user.user_id]
  );
  if (frozenCheck[0]?.wallet_frozen) {
    return res.status(403).json({ message: 'Wallet is frozen. Please contact support.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const ref = `TOPUP${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // ถ้าเป็นบัตรเครดิต → charge ผ่าน Omise ก่อน
    if (method === 'credit_card') {
      const Omise = require('omise')({ secretKey: process.env.OMISE_SECRET_KEY });
      const charge = await Omise.charges.create({
        amount: Math.round(Number(amount) * 100),
        currency: 'thb',
        card: token,
        metadata: { ref, type: 'wallet_topup' },
      });

      if (charge.status !== 'successful') {
        await conn.rollback();
        return res.status(400).json({ message: 'Card charge failed.' });
      }
    }

    // เพิ่มยอด wallet
    await conn.query(
      'UPDATE users SET wallet_balance = wallet_balance + ? WHERE user_id = ?',
      [amount, req.user.user_id]
    );

    // บันทึก transaction
    await conn.query(
      'INSERT INTO wallet_transactions (user_id, amount, type, ref) VALUES (?, ?, ?, ?)',
      [req.user.user_id, amount, 'topup', ref]
    );

    await conn.commit();

    // ดึงยอดใหม่
    const [rows] = await pool.query(
      'SELECT wallet_balance FROM users WHERE user_id = ?',
      [req.user.user_id]
    );

    return res.status(200).json({
      message: 'Top up successful.',
      ref,
      amount,
      new_balance: rows[0].wallet_balance,
    });
  } catch (error) {
    await conn.rollback();
    console.error('Topup error:', error);
    return res.status(500).json({ message: 'Server error processing top up.' });
  } finally {
    conn.release();
  }
});

/**
 * @swagger
 * /api/wallet/deduct:
 *   post:
 *     summary: Deduct from wallet (for charging sessions)
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, session_id]
 *             properties:
 *               amount:
 *                 type: number
 *               session_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Deduction successful
 *       400:
 *         description: Insufficient balance or invalid input
 *       500:
 *         description: Server error
 */
router.post('/deduct', auth, async (req, res) => {
  const { amount, session_id } = req.body;

  if (!amount || !session_id) {
    return res.status(400).json({ message: 'amount and session_id are required.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // เช็คยอดคงเหลือ + wallet_frozen
    const [userRows] = await conn.query(
      'SELECT wallet_balance, wallet_frozen FROM users WHERE user_id = ? FOR UPDATE',
      [req.user.user_id]
    );

    if (userRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'User not found.' });
    }

    if (userRows[0].wallet_frozen) {
      await conn.rollback();
      return res.status(403).json({ message: 'Wallet is frozen. Please contact support.' });
    }

    if (userRows[0].wallet_balance < amount) {
      await conn.rollback();
      return res.status(400).json({
        message: 'Insufficient wallet balance.',
        balance: userRows[0].wallet_balance,
        required: amount,
      });
    }

    const ref = `DEDUCT${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // ตัดยอด
    await conn.query(
      'UPDATE users SET wallet_balance = wallet_balance - ? WHERE user_id = ?',
      [amount, req.user.user_id]
    );

    // บันทึก transaction
    await conn.query(
      'INSERT INTO wallet_transactions (user_id, amount, type, ref) VALUES (?, ?, ?, ?)',
      [req.user.user_id, amount, 'deduct', `session_${session_id}`]
    );

    // บันทึก payment record ด้วย
    const [payResult] = await conn.query(
      `INSERT INTO payments (user_id, session_id, amount, method, status, transaction_ref, paid_at)
       VALUES (?, ?, ?, 'wallet', 'completed', ?, NOW())`,
      [req.user.user_id, session_id, amount, ref]
    );

    await conn.commit();

    const [rows] = await pool.query(
      'SELECT wallet_balance FROM users WHERE user_id = ?',
      [req.user.user_id]
    );

    return res.status(200).json({
      message: 'Deduction successful.',
      ref,
      amount,
      new_balance: rows[0].wallet_balance,
      payment_id: payResult.insertId,
    });
  } catch (error) {
    await conn.rollback();
    console.error('Deduct error:', error);
    return res.status(500).json({ message: 'Server error processing deduction.' });
  } finally {
    conn.release();
  }
});

/**
 * @swagger
 * /api/wallet/qr:
 *   post:
 *     summary: Generate PromptPay QR for wallet top up (no balance change yet)
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: QR image returned
 *       400:
 *         description: Invalid amount
 *       500:
 *         description: Server error
 */
router.post('/qr', auth, async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount < 20) {
    return res.status(400).json({ message: 'Minimum amount is 20 baht.' });
  }

  try {
    const promptpayId = process.env.PROMPTPAY_ID || '0812345678';
    const roundedAmount = Math.round(Number(amount) * 100) / 100;
    const qr_payload = generatePayload(promptpayId, { amount: roundedAmount });
    const qr_image = await QRCode.toDataURL(qr_payload, { width: 300, margin: 2 });

    return res.status(200).json({ qr_image, qr_payload, amount: roundedAmount });
  } catch (error) {
    console.error('Generate wallet QR error:', error);
    return res.status(500).json({ message: 'Server error generating QR.' });
  }
});

module.exports = router;
