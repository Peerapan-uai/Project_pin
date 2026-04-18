const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

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
  const { charger_id } = req.body;

  if (!charger_id) {
    return res.status(400).json({ message: 'charger_id is required.' });
  }

  try {
    // เช็คว่า charger ว่างไหม
    const [chargerRows] = await pool.query(
      `SELECT status FROM chargers WHERE charger_id = ?`,
      [charger_id]
    );

    if (chargerRows.length === 0) {
      return res.status(404).json({ message: 'Charger not found.' });
    }

    if (chargerRows[0].status !== 'available') {
      return res.status(400).json({ message: 'Charger is not available.' });
    }

    const [result] = await pool.query(
      `INSERT INTO bookings (user_id, charger_id, start_time, status)
       VALUES (?, ?, NOW(), 'confirmed')`,
      [req.user.user_id, charger_id]
    );

    // ล็อคตู้ชาร์จทันที → คนอื่นจองไม่ได้
    await pool.query(
      `UPDATE chargers SET status = 'reserved' WHERE charger_id = ?`,
      [charger_id]
    );

    return res.status(201).json({
      message: 'Booking created successfully.',
      booking_id: result.insertId,
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
              s.name AS station_name, s.latitude, s.longitude
       FROM bookings b
       JOIN chargers c ON b.charger_id = c.charger_id
       JOIN stations s ON c.station_id = s.station_id
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
      SELECT b.booking_id, b.status, b.start_time, b.end_time,
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
/// nem
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const [bookingRows] = await pool.query(
      `SELECT charger_id FROM bookings WHERE booking_id = ? AND user_id = ? AND status = 'confirmed'`,
      [req.params.id, req.user.user_id]
    );

    if (bookingRows.length === 0) {
      return res.status(404).json({ message: 'Booking not found or cannot be cancelled.' });
    }

    await pool.query(
      `UPDATE bookings SET status = 'cancelled' WHERE booking_id = ?`,
      [req.params.id]
    );

    // คืนตู้ชาร์จกลับว่าง
    await pool.query(
      `UPDATE chargers SET status = 'available' WHERE charger_id = ? AND status = 'reserved'`,
      [bookingRows[0].charger_id]
    );

    return res.status(200).json({ message: 'Booking cancelled successfully.' });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return res.status(500).json({ message: 'Server error cancelling booking.' });
  }
});

module.exports = router;
