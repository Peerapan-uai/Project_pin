const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { getCurrentPrice } = require('../utils/getTariff');

/**
 * @swagger
 * tags:
 *   name: Sessions
 *   description: Charging session endpoints
 */

// Helper: find and update vehicle battery after a session
async function updateVehicleBattery(bookingId, userId, chargerId, energyKwh) {
  let vRows = [];
  // Primary: use vehicle_id stored in booking
  if (bookingId) {
    const [rows] = await pool.query(
      `SELECT v.vehicle_id, v.battery_current_kwh, v.battery_capacity_kwh
       FROM vehicles v
       JOIN bookings b ON b.vehicle_id = v.vehicle_id
       WHERE b.booking_id = ? AND v.user_id = ?`,
      [bookingId, userId]
    );
    vRows = rows;
  }
  // Fallback: connector_type match (for bookings created before vehicle_id was stored)
  if (vRows.length === 0) {
    const [rows] = await pool.query(
      `SELECT v.vehicle_id, v.battery_current_kwh, v.battery_capacity_kwh
       FROM vehicles v
       JOIN chargers c ON c.connector_type = v.connector_type
       WHERE v.user_id = ? AND c.charger_id = ? LIMIT 1`,
      [userId, chargerId]
    );
    vRows = rows;
  }
  if (vRows.length === 0) return { batteryAfter: null, batteryCapacity: null };

  const v = vRows[0];
  const updated = Math.min(
    parseFloat(((parseFloat(v.battery_current_kwh) || 0) + parseFloat(energyKwh)).toFixed(3)),
    parseFloat(v.battery_capacity_kwh)
  );
  await pool.query(`UPDATE vehicles SET battery_current_kwh = ? WHERE vehicle_id = ?`, [updated, v.vehicle_id]);
  return { batteryAfter: updated, batteryCapacity: parseFloat(v.battery_capacity_kwh) };
}

/**
 * @swagger
 * /api/sessions/start:
 *   post:
 *     summary: Start a charging session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [booking_id, charger_id]
 *             properties:
 *               booking_id:
 *                 type: integer
 *               charger_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Session started
 *       400:
 *         description: Invalid booking or charger unavailable
 *       500:
 *         description: Server error
 */
/// nem
router.post('/start', auth, async (req, res) => {
  const { booking_id, charger_id } = req.body;

  if (!booking_id || !charger_id) {
    return res.status(400).json({ message: 'booking_id and charger_id are required.' });
  }

  try {
    // เช็ค wallet_frozen + outstanding_debt + unpaid payment
    const [userRows] = await pool.query(
      'SELECT wallet_balance, wallet_frozen, outstanding_debt FROM users WHERE user_id = ?',
      [req.user.user_id]
    );
    if (userRows.length > 0 && userRows[0].wallet_frozen) {
      return res.status(402).json({ message: 'Wallet is frozen. Please contact support.' });
    }
    if (userRows.length > 0 && parseFloat(userRows[0].outstanding_debt) > 0) {
      return res.status(402).json({
        message: `คุณมียอดค้างชำระ ฿${parseFloat(userRows[0].outstanding_debt).toFixed(2)} กรุณาชำระยอดค้างก่อนเริ่มชาร์จ`,
        code: 'OUTSTANDING_DEBT',
        debt: parseFloat(userRows[0].outstanding_debt),
      });
    }

    const [unpaidRows] = await pool.query(
      `SELECT payment_id FROM payments WHERE user_id = ? AND status = 'pending' LIMIT 1`,
      [req.user.user_id]
    );
    if (unpaidRows.length > 0) {
      return res.status(400).json({ message: 'You have a pending unpaid payment. Please complete it before starting a new session.' });
    }

    const [bookingRows] = await pool.query(
      `SELECT * FROM bookings WHERE booking_id = ? AND user_id = ? AND status = 'confirmed'`,
      [booking_id, req.user.user_id]
    );

    if (bookingRows.length === 0) {
      return res.status(400).json({ message: 'No valid confirmed booking found.' });
    }

    if (bookingRows[0].charger_id !== Number(charger_id)) {
      return res.status(400).json({ message: 'Charger does not match booking.' });
    }

    // ยอมรับทั้ง available และ reserved (reserved = มีคนจองและเป็นคนนั้นที่กำลังจะใช้)
    const [chargerRows] = await pool.query(
      `SELECT * FROM chargers WHERE charger_id = ? AND status IN ('available', 'reserved')`,
      [charger_id]
    );
    if (chargerRows.length === 0) {
      return res.status(400).json({ message: 'Charger is not available.' });
    }

    // Feature 7 — overheat protection
    const ch = chargerRows[0];
    if (ch.temperature_celsius != null && ch.max_temperature_celsius != null
        && parseFloat(ch.temperature_celsius) > parseFloat(ch.max_temperature_celsius)) {
      return res.status(503).json({
        message: 'ขออภัย ตู้ชาร์จนี้ไม่พร้อมใช้งานชั่วคราว กรุณารอสักครู่หรือเลือกตู้อื่น',
        code: 'CHARGER_OVERHEATED',
      });
    }

    // C — บังคับเติมเงินขั้นต่ำก่อนเริ่มชาร์จ
    const MIN_BALANCE = 20; // บาท
    const walletBalance = parseFloat(userRows[0].wallet_balance) || 0;
    if (walletBalance < MIN_BALANCE) {
      return res.status(400).json({
        message: `ยอดเงินในกระเป๋าไม่เพียงพอ ต้องมีอย่างน้อย ${MIN_BALANCE} บาท (ปัจจุบัน ${walletBalance.toFixed(2)} บาท)`,
        code: 'INSUFFICIENT_BALANCE',
        min_balance: MIN_BALANCE,
        current_balance: walletBalance,
      });
    }

    // ใช้ transaction ป้องกัน partial update (session created แต่ booking ไม่ update)
    const conn = await pool.getConnection();
    let sessionId;
    try {
      await conn.beginTransaction();

      const [result] = await conn.query(
        `INSERT INTO charging_sessions (booking_id, user_id, charger_id, start_time, status)
         VALUES (?, ?, ?, NOW(), 'charging')`,
        [booking_id, req.user.user_id, charger_id]
      );
      sessionId = result.insertId;

      await conn.query(
        `UPDATE chargers SET status = 'charging' WHERE charger_id = ?`,
        [charger_id]
      );

      await conn.query(
        `UPDATE bookings SET status = 'active' WHERE booking_id = ?`,
        [booking_id]
      );

      await conn.commit();
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }

    try {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'charging')`,
        [req.user.user_id, 'เริ่มชาร์จแล้ว', `เริ่มการชาร์จเรียบร้อยแล้ว กดหยุดชาร์จเมื่อต้องการสิ้นสุด Session`]
      );
    } catch (_) {}

    return res.status(201).json({
      message: 'Charging session started.',
      session_id: sessionId,
    });
  } catch (error) {
    console.error('Start session error:', error);
    return res.status(500).json({ message: 'Server error starting session.' });
  }
});

/**
 * @swagger
 * /api/sessions/{id}/preview-cost:
 *   get:
 *     summary: Preview estimated cost of stopping current session (no actual stop)
 *     tags: [Sessions]
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
 *         description: Preview data with cost, wallet balance, and saved cards
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */
/// nem
router.get('/:id/preview-cost', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.session_id, s.start_time, c.price_per_kwh, c.power_kw, c.charger_id
       FROM charging_sessions s
       JOIN chargers c ON s.charger_id = c.charger_id
       WHERE s.session_id = ? AND s.user_id = ? AND s.status = 'charging'`,
      [req.params.id, req.user.user_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Active session not found.' });
    }
    const session = rows[0];
    const durationSec = Math.floor((Date.now() - new Date(session.start_time).getTime()) / 1000);
    const durationMin = durationSec / 60;
    const energy_kwh = parseFloat(((session.power_kw * durationMin) / 60).toFixed(3));
    const currentPrice = await getCurrentPrice(session.charger_id) || session.price_per_kwh;
    const total_cost = parseFloat((energy_kwh * currentPrice).toFixed(2));

    const [userRows] = await pool.query(
      'SELECT wallet_balance, wallet_frozen FROM users WHERE user_id = ?',
      [req.user.user_id]
    );
    const user = userRows[0];

    return res.status(200).json({
      energy_kwh,
      total_cost,
      wallet_balance: parseFloat(user?.wallet_balance || 0),
      wallet_frozen: !!user?.wallet_frozen,
    });
  } catch (error) {
    console.error('Preview cost error:', error);
    return res.status(500).json({ message: 'Server error computing preview cost.' });
  }
});

/**
 * @swagger
 * /api/sessions/{id}/stop:
 *   patch:
 *     summary: Stop a charging session with explicit payment method
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [energy_kwh, payment_method]
 *             properties:
 *               energy_kwh:
 *                 type: number
 *               payment_method:
 *                 type: string
 *                 enum: [wallet, credit_card]
 *               card_id:
 *                 type: string
 *                 description: Required when payment_method is credit_card
 *     responses:
 *       200:
 *         description: Session stopped, payment recorded
 *       402:
 *         description: Payment failed (insufficient balance or card declined)
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */
/// nem
router.patch('/:id/stop', auth, async (req, res) => {
  const { energy_kwh, payment_method, card_id, redeem_token } = req.body;

  if (!energy_kwh) {
    return res.status(400).json({ message: 'energy_kwh is required.' });
  }
  if (!payment_method || !['wallet', 'credit_card'].includes(payment_method)) {
    return res.status(400).json({ message: "payment_method ต้องเป็น 'wallet' หรือ 'credit_card'" });
  }
  if (payment_method === 'credit_card' && !card_id) {
    return res.status(400).json({ message: 'card_id is required for credit_card payment.' });
  }

  try {
    const [sessionRows] = await pool.query(
      `SELECT s.*, c.price_per_kwh, c.charger_id AS cid FROM charging_sessions s
       JOIN chargers c ON s.charger_id = c.charger_id
       WHERE s.session_id = ? AND s.user_id = ? AND s.status = 'charging'`,
      [req.params.id, req.user.user_id]
    );
    if (sessionRows.length === 0) {
      return res.status(404).json({ message: 'Active session not found.' });
    }
    const session = sessionRows[0];
    const touPrice = await getCurrentPrice(session.charger_id) || session.price_per_kwh;
    let totalCost = parseFloat((parseFloat(energy_kwh) * parseFloat(touPrice)).toFixed(2));

    // Feature 6: apply redeem discount
    let discount = 0;
    if (redeem_token) {
      const [redeemRows] = await pool.query(
        "SELECT amount FROM point_transactions WHERE ref = ? AND user_id = ? AND type = 'redeem'",
        [redeem_token, req.user.user_id]
      );
      if (redeemRows.length > 0) {
        discount = Math.abs(redeemRows[0].amount) / 10;
        totalCost = Math.max(0, parseFloat((totalCost - discount).toFixed(2)));
      }
    }

    if (payment_method === 'wallet') {
      // ตรวจสอบ wallet + หยุดชาร์จ + ตัดเงิน — ทำใน transaction เดียว
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        const [userRows] = await conn.query(
          'SELECT wallet_balance, wallet_frozen FROM users WHERE user_id = ? FOR UPDATE',
          [req.user.user_id]
        );
        const user = userRows[0];

        if (user.wallet_frozen) {
          await conn.rollback();
          return res.status(402).json({ message: 'Wallet is frozen.', code: 'WALLET_FROZEN' });
        }
        const balance = parseFloat(user.wallet_balance);
        if (balance < totalCost) {
          await conn.rollback();
          return res.status(402).json({
            message: `ยอดเงินในกระเป๋าไม่พอ (มี ฿${balance.toFixed(2)} ขาด ฿${(totalCost - balance).toFixed(2)})`,
            code: 'INSUFFICIENT_BALANCE',
            wallet_balance: balance,
            shortage: parseFloat((totalCost - balance).toFixed(2)),
          });
        }

        await conn.query(`UPDATE charging_sessions SET end_time = NOW(), status = 'completed', energy_kwh = ? WHERE session_id = ?`, [energy_kwh, req.params.id]);
        await conn.query(`UPDATE chargers SET status = 'available' WHERE charger_id = ?`, [session.charger_id]);
        await conn.query(`UPDATE bookings SET status = 'completed' WHERE booking_id = ?`, [session.booking_id]);
        await conn.query('UPDATE users SET wallet_balance = wallet_balance - ? WHERE user_id = ?', [totalCost, req.user.user_id]);
        await conn.query('INSERT INTO wallet_transactions (user_id, amount, type, ref) VALUES (?, ?, ?, ?)', [req.user.user_id, totalCost, 'deduct', `session_${req.params.id}`]);
        const ref = `DEDUCT${Date.now()}${Math.floor(Math.random() * 1000)}`;
        const [payResult] = await conn.query(
          `INSERT INTO payments (user_id, session_id, amount, method, status, transaction_ref, paid_at) VALUES (?, ?, ?, 'wallet', 'completed', ?, NOW())`,
          [req.user.user_id, req.params.id, totalCost, ref]
        );
        await conn.commit();

        // อัพเดท battery (best effort)
        let batteryAfter = null, batteryCapacity = null;
        try {
          ({ batteryAfter, batteryCapacity } = await updateVehicleBattery(session.booking_id, req.user.user_id, session.charger_id, energy_kwh));
        } catch (batteryErr) { console.error('Battery update error (wallet stop):', batteryErr); }

        // notification + low balance check
        try {
          await pool.query(`INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'charging')`,
            [req.user.user_id, 'ชาร์จเสร็จสิ้น', `ชาร์จไป ${energy_kwh} kWh คิดเป็นเงิน ${totalCost} บาท ตัดเงินจาก wallet แล้ว`]);
          const [newBalRows] = await pool.query('SELECT wallet_balance FROM users WHERE user_id = ?', [req.user.user_id]);
          const newBal = parseFloat(newBalRows[0]?.wallet_balance || 0);
          if (newBal < 100 && newBal > 0) {
            await pool.query(`INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'ยอดเงินใกล้หมด', ?, 'payment')`,
              [req.user.user_id, `ยอดเงินในกระเป๋าเหลือ ฿${newBal.toFixed(2)} กรุณาเติมเงินเพื่อใช้งานต่อเนื่อง`]);
          }
        } catch (_) {}

        // Feature 6: earn reward points
        try {
          const earnedPoints = Math.floor(totalCost);
          if (earnedPoints > 0) {
            const expDate = new Date(); expDate.setFullYear(expDate.getFullYear() + 2);
            const expStr = expDate.toISOString().split('T')[0];
            await pool.query(
              'INSERT INTO point_balances (user_id, balance) VALUES (?, ?) ON DUPLICATE KEY UPDATE balance = balance + ?',
              [req.user.user_id, earnedPoints, earnedPoints]
            );
            await pool.query(
              "INSERT INTO point_transactions (user_id, amount, type, ref, expires_at) VALUES (?, ?, 'earn', ?, ?)",
              [req.user.user_id, earnedPoints, `session_${req.params.id}`, expStr]
            );
          }
        } catch (_) {}

        return res.status(200).json({
          message: 'Charging session stopped.',
          energy_kwh: parseFloat(energy_kwh),
          total_cost: totalCost,
          discount,
          wallet_deducted: true,
          payment_method: 'wallet',
          payment_id: payResult.insertId,
          battery_after_kwh: batteryAfter,
          battery_capacity_kwh: batteryCapacity,
          points_earned: Math.floor(totalCost),
        });
      } catch (txErr) {
        try { await conn.rollback(); } catch (_) {}
        throw txErr;
      } finally {
        conn.release();
      }
    }

    // credit_card: charge ก่อน → ถ้าสำเร็จถึงหยุด session (ถ้า fail session ยังชาร์จอยู่ ลองใหม่ได้)
    const [userRows] = await pool.query('SELECT omise_customer_id FROM users WHERE user_id = ?', [req.user.user_id]);
    const customerId = userRows[0]?.omise_customer_id;
    if (!customerId) {
      return res.status(402).json({ message: 'ไม่พบข้อมูลบัตรเครดิต', code: 'NO_CUSTOMER' });
    }

    const basicAuth = Buffer.from(`${process.env.OMISE_SECRET_KEY}:`).toString('base64');
    const chargeRes = await fetch('https://api.omise.co/charges', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
        'Omise-Idempotency-Key': `session-${req.params.id}-card-${card_id}`,
      },
      body: JSON.stringify({
        amount: Math.max(Math.round(totalCost * 100), 2000), // Omise minimum 2000 satang = ฿20
        currency: 'thb',
        customer: customerId,
        card: card_id,
        metadata: { session_id: req.params.id, type: 'charging_fee' },
      }),
    });
    const charge = await chargeRes.json();

    if (charge.status !== 'successful') {
      const omiseMsg = charge.failure_message || charge.message || 'unknown';
      console.error('Omise charge failed:', JSON.stringify(charge));
      return res.status(402).json({ message: `การชำระเงินผ่านบัตรไม่สำเร็จ: ${omiseMsg}`, code: 'CARD_CHARGE_FAILED' });
    }

    // charge สำเร็จแล้ว → หยุด session
    await Promise.all([
      pool.query(`UPDATE charging_sessions SET end_time = NOW(), status = 'completed', energy_kwh = ? WHERE session_id = ?`, [energy_kwh, req.params.id]),
      pool.query(`UPDATE chargers SET status = 'available' WHERE charger_id = ?`, [session.charger_id]),
      pool.query(`UPDATE bookings SET status = 'completed' WHERE booking_id = ?`, [session.booking_id]),
    ]);

    const [payResult] = await pool.query(
      `INSERT INTO payments (user_id, session_id, amount, method, status, transaction_ref, paid_at) VALUES (?, ?, ?, 'credit_card', 'completed', ?, NOW())`,
      [req.user.user_id, req.params.id, totalCost, charge.id]
    );

    // อัพเดท battery (best effort)
    let batteryAfter = null, batteryCapacity = null;
    try {
      ({ batteryAfter, batteryCapacity } = await updateVehicleBattery(session.booking_id, req.user.user_id, session.charger_id, energy_kwh));
    } catch (batteryErr) { console.error('Battery update error (card stop):', batteryErr); }

    try {
      await pool.query(`INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'charging')`,
        [req.user.user_id, 'ชาร์จเสร็จสิ้น', `ชาร์จไป ${energy_kwh} kWh คิดเป็นเงิน ${totalCost} บาท ตัดเงินผ่านบัตรเครดิตแล้ว`]);
    } catch (_) {}

    // Feature 6: earn reward points (card path)
    try {
      const earnedPoints = Math.floor(totalCost);
      if (earnedPoints > 0) {
        const expDate = new Date(); expDate.setFullYear(expDate.getFullYear() + 2);
        const expStr = expDate.toISOString().split('T')[0];
        await pool.query(
          'INSERT INTO point_balances (user_id, balance) VALUES (?, ?) ON DUPLICATE KEY UPDATE balance = balance + ?',
          [req.user.user_id, earnedPoints, earnedPoints]
        );
        await pool.query(
          "INSERT INTO point_transactions (user_id, amount, type, ref, expires_at) VALUES (?, ?, 'earn', ?, ?)",
          [req.user.user_id, earnedPoints, `session_${req.params.id}`, expStr]
        );
      }
    } catch (_) {}

    return res.status(200).json({
      message: 'Charging session stopped.',
      energy_kwh: parseFloat(energy_kwh),
      total_cost: totalCost,
      discount,
      wallet_deducted: false,
      payment_method: 'credit_card',
      payment_id: payResult.insertId,
      battery_after_kwh: batteryAfter,
      battery_capacity_kwh: batteryCapacity,
      points_earned: Math.floor(totalCost),
    });
  } catch (error) {
    console.error('Stop session error:', error);
    return res.status(500).json({ message: 'Server error stopping session.' });
  }
});

/**
 * @swagger
 * /api/sessions/{id}/status:
 *   get:
 *     summary: Get the current status of a session
 *     tags: [Sessions]
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
 *         description: Session status data
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/sessions/history:
 *   get:
 *     summary: Get charging session history for authenticated user
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of past sessions
 *       500:
 *         description: Server error
 */
// NOTE: /history must be declared BEFORE /:id/status to prevent Express matching "history" as an id param
/// nem
router.get('/history', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.*, c.connector_type, c.power_kw, st.name AS station_name, st.address
       FROM charging_sessions s
       JOIN chargers c ON s.charger_id = c.charger_id
       JOIN stations st ON c.station_id = st.station_id
       WHERE s.user_id = ?
       ORDER BY s.start_time DESC`,
      [req.user.user_id]
    );

    return res.status(200).json({ sessions: rows });
  } catch (error) {
    console.error('Get session history error:', error);
    return res.status(500).json({ message: 'Server error fetching session history.' });
  }
});
/// nem
router.get('/:id/status', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.session_id, s.booking_id, s.status, s.start_time, s.end_time,
              s.energy_kwh, s.full_charge_time, s.idle_fee,
              TIMESTAMPDIFF(SECOND, s.start_time, NOW()) AS duration_seconds,
              c.charger_id, c.connector_type, c.power_kw, c.price_per_kwh,
              c.temperature_celsius, c.max_temperature_celsius, c.idle_fee_enabled,
              st.name AS station_name
       FROM charging_sessions s
       JOIN chargers c ON s.charger_id = c.charger_id
       JOIN stations st ON c.station_id = st.station_id
       WHERE s.session_id = ? AND s.user_id = ?`,
      [req.params.id, req.user.user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    const session = rows[0];

    // Feature 7 — overheat auto-stop ระหว่างชาร์จ
    if (session.status === 'charging'
        && session.temperature_celsius != null
        && session.max_temperature_celsius != null
        && parseFloat(session.temperature_celsius) > parseFloat(session.max_temperature_celsius)) {
      const durationMin = (session.duration_seconds || 0) / 60;
      const energyKwh = parseFloat(((session.power_kw * durationMin) / 60).toFixed(3)) || 0.001;
      const totalCost = parseFloat((energyKwh * session.price_per_kwh).toFixed(2));

      await Promise.all([
        pool.query(`UPDATE charging_sessions SET end_time = NOW(), status = 'completed', energy_kwh = ? WHERE session_id = ?`, [energyKwh, session.session_id]),
        pool.query(`UPDATE chargers SET status = 'available' WHERE charger_id = ?`, [session.charger_id]),
        pool.query(`UPDATE bookings SET status = 'completed' WHERE booking_id = ?`, [session.booking_id]),
      ]);

      try {
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'หยุดชาร์จชั่วคราว', 'ตู้ชาร์จไม่พร้อมใช้งานชั่วคราว ระบบหยุดชาร์จให้อัตโนมัติ กรุณาลองใหม่ภายหลังหรือเลือกตู้อื่น', 'charging')`,
          [req.user.user_id]
        );
      } catch (_) {}

      return res.status(200).json({
        session: { ...session, status: 'completed', energy_kwh: energyKwh },
        auto_stopped: true,
        reason: 'overheat',
        total_cost: totalCost,
        energy_kwh: energyKwh,
        payment_method: 'pending',
        current_temp: session.temperature_celsius,
      });
    }

    // A — auto stop: ถ้ากำลังชาร์จอยู่ + estimated cost >= wallet balance → หยุดอัตโนมัติ
    if (session.status === 'charging') {
      const durationMin = (session.duration_seconds || 0) / 60;
      const estimatedKwh = parseFloat(((session.power_kw * durationMin) / 60).toFixed(3));
      const estimatedCost = parseFloat((estimatedKwh * session.price_per_kwh).toFixed(2));

      const [userRows] = await pool.query(
        'SELECT wallet_balance FROM users WHERE user_id = ?',
        [req.user.user_id]
      );
      const walletBalance = parseFloat(userRows[0]?.wallet_balance) || 0;

      if (estimatedCost > 0 && estimatedCost >= walletBalance) {
        // auto stop — ใช้ energy ที่คำนวณ ณ ตอนนี้
        const energyKwh = estimatedKwh > 0 ? estimatedKwh : 0.001;
        const totalCost = parseFloat((energyKwh * session.price_per_kwh).toFixed(2));

        await Promise.all([
          pool.query(`UPDATE charging_sessions SET end_time = NOW(), status = 'completed', energy_kwh = ? WHERE session_id = ?`, [energyKwh, session.session_id]),
          pool.query(`UPDATE chargers SET status = 'available' WHERE charger_id = ?`, [session.charger_id]),
          pool.query(`UPDATE bookings SET status = 'completed' WHERE booking_id = ?`, [session.booking_id]),
        ]);

        // หัก wallet เท่าที่มี
        let paymentMethod = 'pending';
        if (walletBalance > 0 && walletBalance >= totalCost) {
          await pool.query('UPDATE users SET wallet_balance = wallet_balance - ? WHERE user_id = ?', [totalCost, req.user.user_id]);
          await pool.query('INSERT INTO wallet_transactions (user_id, amount, type, ref) VALUES (?, ?, ?, ?)', [req.user.user_id, totalCost, 'deduct', `session_${session.session_id}`]);
          await pool.query(`INSERT INTO payments (user_id, session_id, amount, method, status, transaction_ref, paid_at) VALUES (?, ?, ?, 'wallet', 'completed', ?, NOW())`,
            [req.user.user_id, session.session_id, totalCost, `AUTOSTOP${Date.now()}`]);
          paymentMethod = 'wallet';
        }

        // อัพเดท battery ของรถ (best effort)
        let batteryAfter = null;
        let batteryCapacity = null;
        try {
          ({ batteryAfter, batteryCapacity } = await updateVehicleBattery(session.booking_id, req.user.user_id, session.charger_id, energyKwh));
        } catch (batteryErr) { console.error('Battery update error (auto-stop):', batteryErr); }

        try {
          await pool.query(
            `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'charging')`,
            [req.user.user_id, 'หยุดชาร์จอัตโนมัติ', `ยอดเงินในกระเป๋าใกล้หมด ระบบหยุดชาร์จอัตโนมัติ ชาร์จไป ${energyKwh} kWh คิดเป็น ${totalCost} บาท`]
          );
        } catch (_) {}

        return res.status(200).json({
          session: { ...session, status: 'completed', energy_kwh: energyKwh },
          auto_stopped: true,
          reason: 'wallet_insufficient',
          total_cost: totalCost,
          energy_kwh: energyKwh,
          payment_method: paymentMethod,
          battery_after_kwh: batteryAfter,
          battery_capacity_kwh: batteryCapacity,
        });
      }
    }

    // Feature 10 — Estimated charge time (CC-CV model, Phase 1: full power, Phase 2: 25% power)
    const CC_TAPER = 0.25;
    let estimated = null;
    if (session.status === 'charging' && session.power_kw > 0) {
      try {
        let vehicleRows = [];
        if (session.booking_id) {
          const [vr] = await pool.query(
            `SELECT v.battery_capacity_kwh, v.battery_current_kwh
             FROM vehicles v JOIN bookings b ON b.vehicle_id = v.vehicle_id
             WHERE b.booking_id = ? AND v.user_id = ?`,
            [session.booking_id, req.user.user_id]
          );
          vehicleRows = vr;
        }
        if (vehicleRows.length === 0) {
          const [vr] = await pool.query(
            `SELECT v.battery_capacity_kwh, v.battery_current_kwh
             FROM vehicles v JOIN chargers c ON c.connector_type = v.connector_type
             WHERE v.user_id = ? AND c.charger_id = ? LIMIT 1`,
            [req.user.user_id, session.charger_id]
          );
          vehicleRows = vr;
        }
        if (vehicleRows.length > 0) {
          const v = vehicleRows[0];
          const capacity = parseFloat(v.battery_capacity_kwh);
          const durationMin = (session.duration_seconds || 0) / 60;
          const addedKwh = (session.power_kw * durationMin) / 60;
          const currentKwh = Math.min(
            parseFloat(((parseFloat(v.battery_current_kwh) || 0) + addedKwh).toFixed(3)),
            capacity
          );
          const pct = (currentKwh / capacity) * 100;
          const targetKwh80 = capacity * 0.8;
          const powerFull = parseFloat(session.power_kw);
          const powerTaper = powerFull * CC_TAPER;

          const minutesTo80 = currentKwh >= targetKwh80
            ? 0
            : Math.ceil(((targetKwh80 - currentKwh) / powerFull) * 60);

          let minutesTo100;
          if (currentKwh >= capacity) {
            minutesTo100 = 0;
          } else if (currentKwh >= targetKwh80) {
            minutesTo100 = Math.ceil(((capacity - currentKwh) / powerTaper) * 60);
          } else {
            minutesTo100 = minutesTo80 + Math.ceil(((capacity - targetKwh80) / powerTaper) * 60);
          }

          estimated = {
            current_percentage: parseFloat(pct.toFixed(1)),
            minutes_to_80: Math.max(0, minutesTo80),
            minutes_to_100: Math.max(0, minutesTo100),
          };
        }
      } catch (_) {}
    }

    // Feature 4 — Auto-stop Hybrid: battery 100% check
    let reachedFull = false;
    if (estimated && estimated.current_percentage >= 100 && session.status === 'charging') {
      if (!session.idle_fee_enabled) {
        // Mode A: auto stop + charge wallet
        const durationMin = (session.duration_seconds || 0) / 60;
        const energyKwh = Math.max(0.001, parseFloat(((session.power_kw * durationMin) / 60).toFixed(3)));
        const touPrice = await getCurrentPrice(session.charger_id) || session.price_per_kwh;
        const totalCost = parseFloat((energyKwh * touPrice).toFixed(2));

        await Promise.all([
          pool.query(`UPDATE charging_sessions SET end_time = NOW(), status = 'completed', energy_kwh = ? WHERE session_id = ?`, [energyKwh, session.session_id]),
          pool.query(`UPDATE chargers SET status = 'available' WHERE charger_id = ?`, [session.charger_id]),
          pool.query(`UPDATE bookings SET status = 'completed' WHERE booking_id = ?`, [session.booking_id]),
        ]);

        let paymentMethod = 'pending';
        const [uRows] = await pool.query('SELECT wallet_balance FROM users WHERE user_id = ?', [req.user.user_id]);
        const walBal = parseFloat(uRows[0]?.wallet_balance) || 0;
        if (walBal >= totalCost) {
          await pool.query('UPDATE users SET wallet_balance = wallet_balance - ? WHERE user_id = ?', [totalCost, req.user.user_id]);
          await pool.query("INSERT INTO wallet_transactions (user_id, amount, type, ref) VALUES (?, ?, 'deduct', ?)", [req.user.user_id, totalCost, `session_${session.session_id}`]);
          await pool.query("INSERT INTO payments (user_id, session_id, amount, method, status, transaction_ref, paid_at) VALUES (?, ?, ?, 'wallet', 'completed', ?, NOW())", [req.user.user_id, session.session_id, totalCost, `FULLCHARGE${Date.now()}`]);
          paymentMethod = 'wallet';
        }

        try {
          await pool.query(`INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'ชาร์จเสร็จ 100%', ?, 'charging')`,
            [req.user.user_id, `รถชาร์จเต็มแล้ว ระบบหยุดชาร์จอัตโนมัติ ชาร์จไป ${energyKwh} kWh คิดเป็น ฿${totalCost}`]);
        } catch (_) {}

        try {
          const { batteryAfter, batteryCapacity } = await updateVehicleBattery(session.booking_id, req.user.user_id, session.charger_id, energyKwh);
          return res.status(200).json({ session: { ...session, status: 'completed', energy_kwh: energyKwh }, auto_stopped: true, reason: 'battery_full', total_cost: totalCost, energy_kwh: energyKwh, payment_method: paymentMethod, battery_after_kwh: batteryAfter, battery_capacity_kwh: batteryCapacity });
        } catch (_) {
          return res.status(200).json({ session: { ...session, status: 'completed', energy_kwh: energyKwh }, auto_stopped: true, reason: 'battery_full', total_cost: totalCost, energy_kwh: energyKwh, payment_method: paymentMethod });
        }
      } else {
        // Mode B: idle_fee_enabled — flag ให้ user ถอดสาย + เช็คคิว + ตั้ง full_charge_time
        reachedFull = true;

        // เช็คว่ามีคิวรออยู่ใน 30 นาที
        const [queueRows] = await pool.query(
          `SELECT booking_id FROM bookings
           WHERE charger_id = ? AND status IN ('pending','confirmed')
             AND scheduled_start <= DATE_ADD(NOW(), INTERVAL 30 MINUTE)
           ORDER BY scheduled_start ASC LIMIT 1`,
          [session.charger_id]
        );
        const hasQueue = queueRows.length > 0;

        if (hasQueue && !session.full_charge_time) {
          await pool.query(
            `UPDATE charging_sessions SET full_charge_time = NOW() WHERE session_id = ?`,
            [session.session_id]
          );
          session.full_charge_time = new Date();
        }
      }
    }

    // Feature 12: คำนวณ idle fee สะสม
    let idleFeeData = null;
    if (session.full_charge_time && !session.end_time && session.status === 'charging') {
      const fullChargeTime = new Date(session.full_charge_time);
      const totalIdleMins = (Date.now() - fullChargeTime.getTime()) / 60000;
      const billableMins = Math.max(0, totalIdleMins - 5);
      const idleFeeRunning = parseFloat((billableMins * 5).toFixed(2));
      idleFeeData = { idle_fee_running: idleFeeRunning, idle_minutes: Math.floor(billableMins), full_charge_time: session.full_charge_time };
    }

    return res.status(200).json({
      session, estimated,
      ...(reachedFull ? { reached_full: true } : {}),
      ...(idleFeeData || {}),
    });
  } catch (error) {
    console.error('Get session status error:', error);
    return res.status(500).json({ message: 'Server error fetching session status.' });
  }
});
/**
 * @swagger
 * /api/sessions/{id}/notify-milestone:
 *   post:
 *     summary: Send in-app notification when charging crosses 80% or 100% (idempotent)
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 */
/// nem — Feature 5
router.post('/:id/notify-milestone', auth, async (req, res) => {
  const { milestone } = req.body;
  if (![80, 100].includes(Number(milestone))) {
    return res.status(400).json({ message: 'milestone ต้องเป็น 80 หรือ 100' });
  }
  try {
    const [sessionRows] = await pool.query(
      `SELECT session_id, user_id FROM charging_sessions WHERE session_id = ? AND user_id = ?`,
      [req.params.id, req.user.user_id]
    );
    if (sessionRows.length === 0) return res.status(404).json({ message: 'Session not found.' });

    const tag = `session_${req.params.id}_${milestone}`;
    const [existing] = await pool.query(
      `SELECT 1 FROM notifications WHERE user_id = ? AND type = 'charging' AND message LIKE ? AND created_at > DATE_SUB(NOW(), INTERVAL 2 HOUR)`,
      [req.user.user_id, `%${tag}%`]
    );
    if (existing.length > 0) return res.json({ sent: false, reason: 'already_sent' });

    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'charging')`,
      [req.user.user_id, `ชาร์จถึง ${milestone}%`, `${tag}: รถของคุณชาร์จถึง ${milestone}% แล้ว`]
    );
    return res.json({ sent: true });
  } catch (error) {
    console.error('Notify milestone error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
});

/**
 * @swagger
 * /api/sessions/{id}/unplug:
 *   post:
 *     summary: ถอดสายชาร์จ — ปิด session, คำนวณ idle fee, หักจาก wallet
 *     description: ถ้าเลย full_charge_time + 5 นาที (grace period) จะคิด idle fee 5 บาท/นาที และหักจาก wallet (ถ้าไม่พอจะเพิ่ม outstanding_debt)
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: session_id
 *     responses:
 *       200:
 *         description: Unplug สำเร็จ (session ถูกปิดเป็น completed, charger กลับเป็น available)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Unplugged successfully." }
 *                 idle_fee: { type: number, example: 25.00, description: ค่า idle fee ที่เก็บ (บาท) — เป็น 0 ถ้ายังไม่เลย grace period }
 *       401: { description: ไม่ได้ login }
 *       404: { description: ไม่มี active session ของ user นี้ }
 *       500: { description: Server error }
 */
/// nem — Feature 12: unplug (ถอดสาย) + commit idle fee
router.post('/:id/unplug', auth, async (req, res) => {
  try {
    const [sessionRows] = await pool.query(
      `SELECT s.session_id, s.booking_id, s.user_id, s.charger_id,
              s.full_charge_time, s.end_time, s.status
       FROM charging_sessions s
       WHERE s.session_id = ? AND s.user_id = ? AND s.status = 'charging'`,
      [req.params.id, req.user.user_id]
    );
    if (sessionRows.length === 0) {
      return res.status(404).json({ message: 'Active session not found.' });
    }
    const session = sessionRows[0];

    let idleFee = 0;
    if (session.full_charge_time) {
      const fullChargeTime = new Date(session.full_charge_time);
      const billableMins = Math.max(0, (Date.now() - fullChargeTime.getTime()) / 60000 - 5);
      idleFee = Math.round(billableMins * 5 * 100) / 100;
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(
        `UPDATE charging_sessions
         SET idle_end_time = NOW(), idle_fee = ?, end_time = NOW(), status = 'completed'
         WHERE session_id = ?`,
        [idleFee, session.session_id]
      );
      await conn.query(
        `UPDATE chargers SET status = 'available' WHERE charger_id = ?`,
        [session.charger_id]
      );
      await conn.query(
        `UPDATE bookings SET status = 'completed' WHERE booking_id = ?`,
        [session.booking_id]
      );
      await conn.commit();
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }

    // เก็บ idle fee จาก wallet/debt (best effort)
    if (idleFee > 0) {
      const { chargeFeeOrAddDebt } = require('../utils/chargeFeeOrAddDebt');
      try {
        await chargeFeeOrAddDebt(req.user.user_id, idleFee, `idle_${session.session_id}`);
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'ค่า Idle Fee', ?, 'charging')`,
          [req.user.user_id, `ถอดสายแล้ว ค่า idle fee ฿${idleFee.toFixed(2)} ถูกหักจากกระเป๋าเงิน`]
        );
      } catch (_) {}
    }

    return res.json({ message: 'Unplugged successfully.', idle_fee: idleFee });
  } catch (error) {
    console.error('Unplug error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
});

/// lalla. GET /api/sessions/all
router.get('/all', auth, roleCheck('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.*, u.first_name, u.last_name, c.charger_name, st.name AS station_name
      from charging_sessions s
      join chargers c on s.charger_id = c.charger_id
      join stations st on c.station_id = st.station_id
      join users u on s.user_id = u.user_id
      order by s.start_time DESC`)
    return res.status(200).json({ sessions: rows })
  } catch (error) {
    console.error('Get all sessions error:', error)
    return res.status(500).json({ message: 'Server error fetching sessions.' })
  }
});
module.exports = router;
