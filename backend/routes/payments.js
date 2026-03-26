const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment endpoints
 */

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Create a payment for a completed session
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
/// nem
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
    ///  เช็คว่าจ่ายไปแล้วรึยัง
    const [existingPayment] = await pool.query(
      'SELECT payment_id FROM payments WHERE session_id = ?',
      [session_id]
    );
    /// ในกรณีเคยจ่ายไปแล้ว db คืน array เลยไม่สามารถจ่ายซ้ำได้
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
/// nem
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
 * /api/payments/{id}:
 *   get:
 *     summary: Get a specific payment by ID
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
/// nem 
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
