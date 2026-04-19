const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

/**
 * @swagger
 * tags:
 *   name: Sessions
 *   description: Charging session endpoints
 */

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
    // เช็ค wallet_frozen + unpaid payment
    const [userRows] = await pool.query(
      'SELECT wallet_balance, wallet_frozen FROM users WHERE user_id = ?',
      [req.user.user_id]
    );
    if (userRows.length > 0 && userRows[0].wallet_frozen) {
      return res.status(402).json({ message: 'Wallet is frozen. Please contact support.' });
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
 * /api/sessions/{id}/stop:
 *   patch:
 *     summary: Stop a charging session
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
 *             properties:
 *               energy_kwh:
 *                 type: number
 *                 description: Energy consumed in kWh
 *     responses:
 *       200:
 *         description: Session stopped, total cost returned
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */
/// nem
router.patch('/:id/stop', auth, async (req, res) => {
  const { energy_kwh } = req.body;

  if (!energy_kwh) {
    return res.status(400).json({ message: 'energy_kwh is required.' });
  }

  try {
    const [sessionRows] = await pool.query(
      `SELECT s.*, c.price_per_kwh FROM charging_sessions s
       JOIN chargers c ON s.charger_id = c.charger_id
       WHERE s.session_id = ? AND s.user_id = ? AND s.status = 'charging'`,
      [req.params.id, req.user.user_id]
    );

    if (sessionRows.length === 0) {
      return res.status(404).json({ message: 'Active session not found.' });
    }
    // ข้อมูล session + ราคาต่อ kWh
    const session = sessionRows[0];
    //คำนวนค่าไฟ
    const totalCost = energy_kwh && session.price_per_kwh
        //parseFloat = แปลง string เป็น number
      ? parseFloat((energy_kwh * session.price_per_kwh).toFixed(2)) //ปัทศนิยม 2 ตำแหน่ง
      : null;

    // ยิง 3 queries พร้อมกัน (ไม่ depend กัน) → ~15ms ดีกว่า sequential
    await Promise.all([
      pool.query(
        `UPDATE charging_sessions SET end_time = NOW(), status = 'completed', energy_kwh = ? WHERE session_id = ?`,
        [energy_kwh, req.params.id]
      ),
      pool.query(
        `UPDATE chargers SET status = 'available' WHERE charger_id = ?`,
        [session.charger_id]
      ),
      pool.query(
        `UPDATE bookings SET status = 'completed' WHERE booking_id = ?`,
        [session.booking_id]
      ),
    ]);

    // auto payment: wallet ก่อน → ถ้าไม่พอ ตัดบัตร Omise (best effort)
    let paymentMethod = null;
    let walletDeducted = false;
    let walletPaymentId = null;

    if (totalCost != null && totalCost > 0) {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        const [existingPayment] = await conn.query(
          `SELECT payment_id, method, status FROM payments WHERE session_id = ? LIMIT 1 FOR UPDATE`,
          [req.params.id]
        );
        if (existingPayment.length > 0) {
          await conn.rollback();
          conn.release();
          return res.status(200).json({
            message: 'Charging session already paid.',
            energy_kwh: energy_kwh,
            total_cost: totalCost,
            wallet_deducted: existingPayment[0].method === 'wallet',
            payment_method: existingPayment[0].method,
            payment_id: existingPayment[0].payment_id,
          });
        }

        const [userRows] = await conn.query(
          'SELECT wallet_balance, wallet_frozen, omise_customer_id FROM users WHERE user_id = ? FOR UPDATE',
          [req.user.user_id]
        );
        const user = userRows[0];
        const ref = `DEDUCT${Date.now()}${Math.floor(Math.random() * 1000)}`;

        if (user && !user.wallet_frozen && user.wallet_balance >= totalCost) {
          // จ่ายด้วย wallet
          await conn.query('UPDATE users SET wallet_balance = wallet_balance - ? WHERE user_id = ?', [totalCost, req.user.user_id]);
          await conn.query('INSERT INTO wallet_transactions (user_id, amount, type, ref) VALUES (?, ?, ?, ?)', [req.user.user_id, totalCost, 'deduct', `session_${req.params.id}`]);
          const [payResult] = await conn.query(
            `INSERT INTO payments (user_id, session_id, amount, method, status, transaction_ref, paid_at) VALUES (?, ?, ?, 'wallet', 'completed', ?, NOW())`,
            [req.user.user_id, req.params.id, totalCost, ref]
          );
          await conn.commit();
          walletDeducted = true;
          walletPaymentId = payResult.insertId;
          paymentMethod = 'wallet';

        } else if (user?.omise_customer_id) {
          // wallet ไม่พอ → ตัดบัตร Omise
          await conn.rollback();
          conn.release();

          const basicAuth = Buffer.from(`${process.env.OMISE_SECRET_KEY}:`).toString('base64');
          const chargeRes = await fetch('https://api.omise.co/charges', {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${basicAuth}`,
              'Content-Type': 'application/json',
              'Omise-Idempotency-Key': `session-${req.params.id}-stop`,
            },
            body: JSON.stringify({
              amount: Math.round(totalCost * 100),
              currency: 'thb',
              customer: user.omise_customer_id,
              metadata: { session_id: req.params.id, type: 'charging_fee' },
            }),
          });
          const charge = await chargeRes.json();

          if (charge.status === 'successful') {
            const conn2 = await pool.getConnection();
            try {
              await conn2.beginTransaction();
              const [existingPayment2] = await conn2.query(
                `SELECT payment_id FROM payments WHERE session_id = ? LIMIT 1 FOR UPDATE`,
                [req.params.id]
              );
              if (existingPayment2.length > 0) {
                await conn2.rollback();
                walletPaymentId = existingPayment2[0].payment_id;
                paymentMethod = 'credit_card';
              } else {
                const [payResult] = await conn2.query(
                  `INSERT INTO payments (user_id, session_id, amount, method, status, transaction_ref, paid_at) VALUES (?, ?, ?, 'credit_card', 'completed', ?, NOW())`,
                  [req.user.user_id, req.params.id, totalCost, charge.id]
                );
                await conn2.commit();
                walletPaymentId = payResult.insertId;
                paymentMethod = 'credit_card';
              }
            } finally {
              conn2.release();
            }
          }
        } else {
          // ไม่มีทั้ง wallet และบัตร → pending
          await conn.rollback();
          paymentMethod = 'pending';
        }
      } catch (payErr) {
        try { await conn.rollback(); } catch (_) {}
        console.warn('Auto-payment skipped:', payErr.message);
      } finally {
        try { conn.release(); } catch (_) {}
      }
      walletDeducted = paymentMethod === 'wallet';
    }

    // อัพเดท battery (best effort)
    try {
      const [vehicleRows] = await pool.query(
        `SELECT v.vehicle_id, v.battery_current_kwh, v.battery_capacity_kwh
         FROM vehicles v
         JOIN chargers c ON c.connector_type = v.connector_type
         WHERE v.user_id = ? AND c.charger_id = ?
         LIMIT 1`,
        [req.user.user_id, session.charger_id]
      );
      if (vehicleRows.length > 0) {
        const v = vehicleRows[0];
        const current = v.battery_current_kwh ?? 0;
        const updated = Math.min(
          parseFloat((current + energy_kwh).toFixed(2)),
          v.battery_capacity_kwh
        );
        await pool.query(
          `UPDATE vehicles SET battery_current_kwh = ? WHERE vehicle_id = ?`,
          [updated, v.vehicle_id]
        );
      }
    } catch (batteryErr) {
      console.warn('Battery update skipped:', batteryErr.message);
    }

    try {
      const costText = totalCost != null ? ` คิดเป็นเงิน ${totalCost} บาท` : ''
      const payNote = paymentMethod === 'wallet' ? ' ตัดเงินจาก wallet แล้ว'
        : paymentMethod === 'credit_card' ? ' ตัดเงินผ่านบัตรเครดิตแล้ว'
        : ' กรุณาชำระเงินเพื่อสิ้นสุดการใช้งาน'
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'charging')`,
        [req.user.user_id, 'ชาร์จเสร็จสิ้น', `ชาร์จไป ${energy_kwh} kWh${costText}${payNote}`]
      );
    } catch (_) {}

    return res.status(200).json({
      message: 'Charging session stopped.',
      energy_kwh: energy_kwh,
      total_cost: totalCost,
      wallet_deducted: walletDeducted,
      payment_method: paymentMethod,
      payment_id: walletPaymentId,
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
      `SELECT s.session_id, s.status, s.start_time, s.end_time,
              s.energy_kwh,
              TIMESTAMPDIFF(SECOND, s.start_time, NOW()) AS duration_seconds,
              c.charger_id, c.connector_type, c.power_kw, c.price_per_kwh,
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

    return res.status(200).json({ session: rows[0] });
  } catch (error) {
    console.error('Get session status error:', error);
    return res.status(500).json({ message: 'Server error fetching session status.' });
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
