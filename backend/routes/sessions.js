const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

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
router.post('/start', auth, async (req, res) => {
  const { booking_id, charger_id } = req.body;

  if (!booking_id || !charger_id) {
    return res.status(400).json({ message: 'booking_id and charger_id are required.' });
  }

  try {
    // Verify the booking belongs to this user and is confirmed
    const [bookingRows] = await pool.query(
      `SELECT * FROM bookings WHERE booking_id = ? AND user_id = ? AND status = 'confirmed'`,
      [booking_id, req.user.user_id]
    );

    if (bookingRows.length === 0) {
      return res.status(400).json({ message: 'No valid confirmed booking found.' });
    }

    // Check charger is available
    const [chargerRows] = await pool.query(
      `SELECT * FROM chargers WHERE charger_id = ? AND status = 'available'`,
      [charger_id]
    );

    if (chargerRows.length === 0) {
      return res.status(400).json({ message: 'Charger is not available.' });
    }

    // Create session
    const [result] = await pool.query(
      `INSERT INTO sessions (booking_id, user_id, charger_id, start_time, status)
       VALUES (?, ?, ?, NOW(), 'active')`,
      [booking_id, req.user.user_id, charger_id]
    );

    // Mark charger as in_use
    await pool.query(
      `UPDATE chargers SET status = 'in_use' WHERE charger_id = ?`,
      [charger_id]
    );

    // Mark booking as active
    await pool.query(
      `UPDATE bookings SET status = 'active' WHERE booking_id = ?`,
      [booking_id]
    );

    return res.status(201).json({
      message: 'Charging session started.',
      session_id: result.insertId,
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
router.patch('/:id/stop', auth, async (req, res) => {
  const { energy_kwh } = req.body;

  try {
    const [sessionRows] = await pool.query(
      `SELECT s.*, c.price_per_kwh FROM sessions s
       JOIN chargers c ON s.charger_id = c.charger_id
       WHERE s.session_id = ? AND s.user_id = ? AND s.status = 'active'`,
      [req.params.id, req.user.user_id]
    );

    if (sessionRows.length === 0) {
      return res.status(404).json({ message: 'Active session not found.' });
    }

    const session = sessionRows[0];
    const totalCost = energy_kwh && session.price_per_kwh
      ? parseFloat((energy_kwh * session.price_per_kwh).toFixed(2))
      : null;

    await pool.query(
      `UPDATE sessions SET end_time = NOW(), status = 'completed',
       energy_kwh = ?, total_cost = ? WHERE session_id = ?`,
      [energy_kwh || null, totalCost, req.params.id]
    );

    // Set charger back to available
    await pool.query(
      `UPDATE chargers SET status = 'available' WHERE charger_id = ?`,
      [session.charger_id]
    );

    // Update booking status to completed
    await pool.query(
      `UPDATE bookings SET status = 'completed' WHERE booking_id = ?`,
      [session.booking_id]
    );

    return res.status(200).json({
      message: 'Charging session stopped.',
      energy_kwh: energy_kwh || null,
      total_cost: totalCost,
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
router.get('/history', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.*, c.connector_type, c.power_kw, st.name AS station_name, st.address
       FROM sessions s
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

router.get('/:id/status', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.session_id, s.status, s.start_time, s.end_time,
              s.energy_kwh, s.total_cost,
              c.charger_id, c.connector_type, c.power_kw,
              st.name AS station_name
       FROM sessions s
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

module.exports = router;
