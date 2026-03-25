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
 *             required: [charger_id, vehicle_id, start_time, end_time]
 *             properties:
 *               charger_id:
 *                 type: integer
 *               vehicle_id:
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
  const { charger_id, vehicle_id, start_time, end_time } = req.body;

  if (!charger_id || !vehicle_id || !start_time || !end_time) {
    return res.status(400).json({ message: 'charger_id, vehicle_id, start_time, and end_time are required.' });
  }

  try {
    // Check for conflicting bookings on the same charger
    const [conflicts] = await pool.query(
      `SELECT booking_id FROM bookings
       WHERE charger_id = ? AND status NOT IN ('cancelled')
       AND NOT (end_time <= ? OR start_time >= ?)`,
      [charger_id, start_time, end_time]
    );

    if (conflicts.length > 0) {
      return res.status(400).json({ message: 'Time slot conflicts with an existing booking.' });
    }

    const [result] = await pool.query(
      `INSERT INTO bookings (user_id, charger_id, vehicle_id, start_time, end_time, status)
       VALUES (?, ?, ?, ?, ?, 'confirmed')`,
      [req.user.user_id, charger_id, vehicle_id, start_time, end_time]
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
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.*, c.connector_type, c.power_kw, s.name AS station_name,
              v.make, v.model, v.license_plate
       FROM bookings b
       JOIN chargers c ON b.charger_id = c.charger_id
       JOIN stations s ON c.station_id = s.station_id
       JOIN vehicles v ON b.vehicle_id = v.vehicle_id
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
              u.name AS user_name, v.make, v.model, v.license_plate
       FROM bookings b
       JOIN users u ON b.user_id = u.user_id
       JOIN vehicles v ON b.vehicle_id = v.vehicle_id
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
router.get('/all', auth, roleCheck('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(`select c.charger_id, b.user_id, 
    u.first_name, u.last_name
  from bookings
  join chargers on  c.charger_id =  b.charger_id
  join users on u.user_id = b.user_id
  `);
  return res.status(200).json({  bookings: rows })
  } catch (error) {
    console.error('Get all booking error:', error);
    return res.status(500).json({ message: 'Server error fetching booking.'});
  }
});
//* lalla

router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.*, c.connector_type, c.power_kw, s.name AS station_name, s.address,
              v.make, v.model, v.license_plate
       FROM bookings b
       JOIN chargers c ON b.charger_id = c.charger_id
       JOIN stations s ON c.station_id = s.station_id
       JOIN vehicles v ON b.vehicle_id = v.vehicle_id
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
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const [result] = await pool.query(
      `UPDATE bookings SET status = 'cancelled'
       WHERE booking_id = ? AND user_id = ? AND status = 'confirmed'`,
      [req.params.id, req.user.user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Booking not found or cannot be cancelled.' });
    }

    return res.status(200).json({ message: 'Booking cancelled successfully.' });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return res.status(500).json({ message: 'Server error cancelling booking.' });
  }
});

module.exports = router;
