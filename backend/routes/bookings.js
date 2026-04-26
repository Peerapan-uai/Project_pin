const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { chargeFeeOrAddDebt } = require('../utils/chargeFeeOrAddDebt');

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Booking management endpoints
 */

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [charger_id, start_time, end_time]
 *             properties:
 *               charger_id:
 *                 type: integer
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Booking created
 *       400:
 *         description: Missing required fields or time conflict
 *       500:
 *         description: Server error
 */
router.post('/', auth, async (req, res) => {
  const { charger_id, vehicle_id, scheduled_start, duration_min } = req.body;

  if (!charger_id) {
    return res.status(400).json({ message: 'charger_id is required.' });
  }

  const VALID_DURATIONS = [15, 30, 45, 60, 90, 120];
  const durMin = duration_min ? Number(duration_min) : 60;
  const isScheduled = !!scheduled_start;

  if (isScheduled) {
    if (!VALID_DURATIONS.includes(durMin)) {
      return res.status(400).json({ message: 'duration_min ต้องเป็น 15/30/45/60/90/120' });
    }
    const scheduledAt = new Date(scheduled_start);
    if (isNaN(scheduledAt.getTime())) {
      return res.status(400).json({ message: 'scheduled_start ไม่ถูกต้อง' });
    }
    const minsFromNow = (scheduledAt.getTime() - Date.now()) / 60000;
    if (minsFromNow < 5) {
      return res.status(400).json({ message: 'scheduled_start ต้องอยู่ในอนาคตอย่างน้อย 5 นาที' });
    }
    if (minsFromNow > 7 * 24 * 60) {
      return res.status(400).json({ message: 'จองล่วงหน้าได้ไม่เกิน 7 วัน' });
    }
  }

  try {
    const [userRows] = await pool.query(
      'SELECT wallet_frozen FROM users WHERE user_id = ?',
      [req.user.user_id]
    );
    if (userRows.length > 0 && userRows[0].wallet_frozen) {
      return res.status(403).json({ message: 'กระเป๋าเงินของคุณถูกระงับ ไม่สามารถจองได้ กรุณาติดต่อแอดมิน' });
    }

    const [chargerRows] = await pool.query(
      `SELECT status, temperature_celsius, max_temperature_celsius FROM chargers WHERE charger_id = ?`,
      [charger_id]
    );
    if (chargerRows.length === 0) {
      return res.status(404).json({ message: 'Charger not found.' });
    }
    const ch = chargerRows[0];

    if (!isScheduled && ch.status !== 'available') {
      return res.status(400).json({ message: 'Charger is not available.' });
    }

    if (ch.temperature_celsius != null && ch.max_temperature_celsius != null
        && parseFloat(ch.temperature_celsius) > parseFloat(ch.max_temperature_celsius)) {
      return res.status(503).json({
        message: 'ขออภัย ตู้ชาร์จนี้ไม่พร้อมใช้งานชั่วคราว กรุณารอสักครู่หรือเลือกตู้อื่น',
        code: 'CHARGER_OVERHEATED',
      });
    }

    // สำหรับ scheduled booking — เช็ค slot conflict
    if (isScheduled) {
      const scheduledAt = new Date(scheduled_start);
      const [conflictRows] = await pool.query(
        `SELECT 1 FROM bookings WHERE charger_id = ?
          AND status IN ('pending','confirmed','active')
          AND scheduled_start IS NOT NULL
          AND NOT (
            DATE_ADD(scheduled_start, INTERVAL duration_min MINUTE) <= ?
            OR scheduled_start >= DATE_ADD(?, INTERVAL ? MINUTE)
          )
         LIMIT 1`,
        [charger_id, scheduledAt, scheduledAt, durMin]
      );
      if (conflictRows.length > 0) {
        return res.status(409).json({ message: 'ช่วงเวลานี้มีการจองแล้ว กรุณาเลือกเวลาอื่น', code: 'SLOT_CONFLICT' });
      }
    }

    const [result] = await pool.query(
      `INSERT INTO bookings (user_id, charger_id, vehicle_id, start_time, scheduled_start, duration_min, status)
       VALUES (?, ?, ?, NOW(), ?, ?, 'confirmed')`,
      [req.user.user_id, charger_id, vehicle_id || null, isScheduled ? scheduled_start : null, durMin]
    );

    // ล็อคตู้ทันทีเฉพาะ immediate booking
    if (!isScheduled) {
      await pool.query(
        `UPDATE chargers SET status = 'reserved' WHERE charger_id = ?`,
        [charger_id]
      );
    }

    return res.status(201).json({
      message: 'Booking created successfully.',
      booking_id: result.insertId,
      scheduled: isScheduled,
    });
  } catch (error) {
    console.error('Create booking error:', error);
    return res.status(500).json({ message: 'Server error creating booking.' });
  }
});

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Get all bookings for the authenticated user
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookings
 *       500:
 *         description: Server error
 */
/// nem
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.*, c.charger_name, c.connector_type, c.power_kw,
              s.name AS station_name, s.latitude, s.longitude,
              cs.session_id
       FROM bookings b
       JOIN chargers c ON b.charger_id = c.charger_id
       JOIN stations s ON c.station_id = s.station_id
       LEFT JOIN charging_sessions cs ON cs.booking_id = b.booking_id AND cs.status = 'charging'
       WHERE b.user_id = ?
       ORDER BY b.start_time DESC`,
      [req.user.user_id]
    );

    return res.status(200).json(rows);
  } catch (error) {
    console.error('Get bookings error:', error);
    return res.status(500).json({ message: 'Server error fetching bookings.' });
  }
});

/**
 * @swagger
 * /api/bookings/queue/{chargerId}:
 *   get:
 *     summary: Get the booking queue for a specific charger
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chargerId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Upcoming bookings for the charger
 *       500:
 *         description: Server error
 */
router.get('/queue/:chargerId', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.booking_id, b.start_time, b.end_time, b.status,
              CONCAT(u.first_name, ' ', u.last_name) AS user_name
       FROM bookings b
       JOIN users u ON b.user_id = u.user_id
       WHERE b.charger_id = ? AND b.status = 'confirmed' AND b.start_time >= NOW()
       ORDER BY b.start_time ASC`,
      [req.params.chargerId]
    );

    return res.status(200).json({ queue: rows });
  } catch (error) {
    console.error('Get booking queue error:', error);
    return res.status(500).json({ message: 'Server error fetching booking queue.' });
  }
});

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get a specific booking by ID
 *     tags: [Bookings]
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
 *         description: Booking data
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/bookings/all:
 *   get:
 *     summary: Get all bookings (Admin only)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all bookings
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
///lalla   GET	/api/bookings/all	Get all bookings (Admin only)
router.get('/all', auth, roleCheck('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT b.booking_id, b.user_id, b.status, b.start_time, b.end_time,
             u.first_name, u.last_name,
             c.charger_id, c.charger_name,
             s.station_id, s.name AS station_name,
             p.amount AS total_amount, p.method AS payment_method, p.status AS payment_status
      FROM bookings b
      JOIN chargers c ON c.charger_id = b.charger_id
      JOIN stations s ON s.station_id = c.station_id
      JOIN users u ON u.user_id = b.user_id
      LEFT JOIN charging_sessions cs ON cs.booking_id = b.booking_id
      LEFT JOIN payments p ON p.session_id = cs.session_id
      ORDER BY b.start_time DESC
    `);
    return res.status(200).json({ bookings: rows });
  } catch (error) {
    console.error('Get all booking error:', error);
    return res.status(500).json({ message: 'Server error fetching booking.' });
  }
});

/**
 * @swagger
 * /api/bookings/{id}/admin-cancel:
 *   patch:
 *     summary: Cancel any booking (Admin only)
 *     tags: [Bookings]
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
 *         description: Booking cancelled successfully
 *       404:
 *         description: Booking not found or already cancelled
 *       500:
 *         description: Server error
 */
///lalla   PATCH /api/bookings/:id/admin-cancel  (Admin cancel any booking)
router.patch('/:id/admin-cancel', auth, roleCheck('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    const [booking] = await pool.query(
      `SELECT charger_id, status FROM bookings WHERE booking_id = ? AND status != 'cancelled'`,
      [id]
    );
    if (booking.length === 0) {
      return res.status(404).json({ message: 'Booking not found or already cancelled.' });
    }

    await pool.query(
      `UPDATE bookings SET status = 'cancelled' WHERE booking_id = ?`,
      [id]
    );

    // คืน charger เป็น available (เฉพาะตู้ที่ยังถูก reserve/charging อยู่)
    await pool.query(
      `UPDATE chargers SET status = 'available' WHERE charger_id = ? AND status IN ('reserved', 'charging')`,
      [booking[0].charger_id]
    );

    return res.status(200).json({ message: 'Booking cancelled successfully.' });
  } catch (error) {
    console.error('Admin cancel booking error:', error);
    return res.status(500).json({ message: 'Server error cancelling booking.' });
  }
});

/// nem — Feature 9.3: smart suggestion (ต้องอยู่ก่อน /:id)
router.get('/suggest-recurring', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT charger_id, DAYNAME(scheduled_start) AS day, HOUR(scheduled_start) AS hour, COUNT(*) AS cnt
       FROM bookings
       WHERE user_id = ? AND status IN ('completed','active')
         AND scheduled_start > DATE_SUB(NOW(), INTERVAL 4 WEEK)
       GROUP BY charger_id, day, hour
       HAVING cnt >= 3`,
      [req.user.user_id]
    );
    return res.json({ suggestions: rows });
  } catch (error) {
    console.error('Suggest recurring error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
});

/// nem
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.*, c.station_id, c.connector_type, c.power_kw, s.name AS station_name, s.address
       FROM bookings b
       JOIN chargers c ON b.charger_id = c.charger_id
       JOIN stations s ON c.station_id = s.station_id
       WHERE b.booking_id = ? AND b.user_id = ?`,
      [req.params.id, req.user.user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    return res.status(200).json({ booking: rows[0] });
  } catch (error) {
    console.error('Get booking error:', error);
    return res.status(500).json({ message: 'Server error fetching booking.' });
  }
});

/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   patch:
 *     summary: Cancel a booking
 *     tags: [Bookings]
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
 *         description: Booking cancelled
 *       404:
 *         description: Booking not found or already cancelled
 *       500:
 *         description: Server error
 */
/// nem — Feature 11: cancel with fee logic
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const [bookingRows] = await pool.query(
      `SELECT booking_id, charger_id, booking_time, scheduled_start
       FROM bookings WHERE booking_id = ? AND user_id = ? AND status IN ('pending','confirmed')`,
      [req.params.id, req.user.user_id]
    );

    if (bookingRows.length === 0) {
      return res.status(404).json({ message: 'Booking not found or cannot be cancelled.' });
    }

    const b = bookingRows[0];
    const scheduledStart = new Date(b.scheduled_start || b.booking_time);
    const minsToStart = (scheduledStart.getTime() - Date.now()) / 60000;

    let fee = 0;
    let feeMethod = null;
    if (minsToStart > 0 && minsToStart < 60) {
      fee = 20;
      feeMethod = await chargeFeeOrAddDebt(req.user.user_id, 20, `cancel_${req.params.id}`);
      try {
        const methodMsg = feeMethod === 'debt' ? 'ยอดค้างชำระได้รับการบันทึก' : 'หักจากกระเป๋าเงินแล้ว';
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'ค่าธรรมเนียมยกเลิก', ?, 'booking')`,
          [req.user.user_id, `ยกเลิกการจองภายใน 1 ชั่วโมง ค่าธรรมเนียม ฿20 ${methodMsg}`]
        );
      } catch (_) {}
    }

    await pool.query(
      `UPDATE bookings SET status = 'cancelled', cancelled_at = NOW(), no_show_fee_charged = ? WHERE booking_id = ?`,
      [fee, req.params.id]
    );

    await pool.query(
      `UPDATE chargers SET status = 'available' WHERE charger_id = ? AND status = 'reserved'`,
      [b.charger_id]
    );

    return res.status(200).json({
      message: 'Booking cancelled successfully.',
      fee_charged: fee,
      fee_method: feeMethod,
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return res.status(500).json({ message: 'Server error cancelling booking.' });
  }
});

module.exports = router;
