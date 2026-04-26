const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Points
 *   description: Reward points endpoints
 */

/**
 * @swagger
 * /api/points/balance:
 *   get:
 *     summary: Get current points balance and history
 *     tags: [Points]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Points balance and transaction history
 */
router.get('/balance', auth, async (req, res) => {
  try {
    const [balRows] = await pool.query(
      'SELECT balance FROM point_balances WHERE user_id = ?',
      [req.user.user_id]
    );
    const balance = balRows[0]?.balance ?? 0;

    const [txns] = await pool.query(
      `SELECT txn_id, amount, type, ref, expires_at, created_at
       FROM point_transactions
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 30`,
      [req.user.user_id]
    );

    return res.json({ balance, transactions: txns });
  } catch (error) {
    console.error('Get points balance error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
});

/**
 * @swagger
 * /api/points/redeem:
 *   post:
 *     summary: Redeem points for discount
 *     tags: [Points]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [points]
 *             properties:
 *               points:
 *                 type: integer
 *                 description: Must be a multiple of 100
 */
router.post('/redeem', auth, async (req, res) => {
  const { points } = req.body;
  if (!points || points <= 0 || points % 100 !== 0) {
    return res.status(400).json({ message: 'points ต้องเป็นทวีคูณของ 100' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [balRows] = await conn.query(
      'SELECT balance FROM point_balances WHERE user_id = ? FOR UPDATE',
      [req.user.user_id]
    );
    const currentBalance = balRows[0]?.balance ?? 0;

    if (currentBalance < points) {
      await conn.rollback();
      return res.status(400).json({ message: `แต้มไม่พอ (มี ${currentBalance} แต้ม ต้องการ ${points})` });
    }

    const discountAmount = points / 10; // 100 แต้ม = 10 บาท
    const redeemToken = `RDM_${req.user.user_id}_${Date.now()}`;

    await conn.query(
      'UPDATE point_balances SET balance = balance - ? WHERE user_id = ?',
      [points, req.user.user_id]
    );

    await conn.query(
      "INSERT INTO point_transactions (user_id, amount, type, ref) VALUES (?, ?, 'redeem', ?)",
      [req.user.user_id, -points, redeemToken]
    );

    await conn.commit();

    const [newBal] = await pool.query(
      'SELECT balance FROM point_balances WHERE user_id = ?',
      [req.user.user_id]
    );

    return res.json({
      discount_amount: discountAmount,
      new_balance: newBal[0]?.balance ?? 0,
      redeem_token: redeemToken,
    });
  } catch (error) {
    await conn.rollback();
    console.error('Redeem points error:', error);
    return res.status(500).json({ message: 'Server error.' });
  } finally {
    conn.release();
  }
});

module.exports = router;
