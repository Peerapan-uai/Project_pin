const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

/**
 * @swagger
 * tags:
 *   name: Stations
 *   description: EV charging station endpoints
 */

/**
 * @swagger
 * /api/stations:
 *   get:
 *     summary: Get all stations (optional filter by connector_type)
 *     tags: [Stations]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: connector_type
 *         schema:
 *           type: string
 *         description: Filter stations by connector type available
 *     responses:
 *       200:
 *         description: List of stations
 *       500:
 *         description: Server error
 */
/// nem
router.get('/', async (req, res) => {
  const { connector_type } = req.query;

  try {
    let query = `
      SELECT s.*,
        COUNT(DISTINCT c.charger_id) AS total_chargers,
        COALESCE(SUM(CASE WHEN c.status = 'available' THEN 1 ELSE 0 END), 0) AS available_chargers,
        ROUND(AVG(r.rating), 1) AS rating,
        COUNT(DISTINCT r.review_id) AS review_count,
        GROUP_CONCAT(DISTINCT c.connector_type) AS connector_types
      FROM stations s
      LEFT JOIN chargers c ON s.station_id = c.station_id
      LEFT JOIN reviews r ON s.station_id = r.station_id
    `;
    let params = [];

    if (connector_type) {
      query += ` WHERE s.station_id IN (
        SELECT station_id FROM chargers WHERE connector_type = ?
      )`;
      params = [connector_type];
    }

    query += ' GROUP BY s.station_id ORDER BY s.station_id ASC';

    const [rows] = await pool.query(query, params);
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Get stations error:', error);
    return res.status(500).json({ message: 'Server error fetching stations.' });
  }
});

/**
 * @swagger
 * /api/stations/{id}:
 *   get:
 *     summary: Get a station by ID with its chargers
 *     tags: [Stations]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Station data with chargers
 *       404:
 *         description: Station not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/stations/nearby:
 *   get:
 *     summary: Get stations sorted by distance from a given location
 *     tags: [Stations]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *         description: Radius in km (default 10)
 *     responses:
 *       200:
 *         description: List of stations sorted by distance
 *       400:
 *         description: Missing lat or lng
 *       500:
 *         description: Server error
 */
/// lalla
router.get('/nearby', async (req, res) => {
  const { lat, lng, radius = 10 } = req.query

  if (!lat || !lng) {
    return res.status(400).json({ message: 'lat and lng are required.' })
  }

  const latNum = parseFloat(lat)
  const lngNum = parseFloat(lng)
  const radiusNum = parseFloat(radius)

  try {
    const [rows] = await pool.query(
      `SELECT s.*,
        COUNT(DISTINCT c.charger_id) AS total_chargers,
        COALESCE(SUM(CASE WHEN c.status = 'available' THEN 1 ELSE 0 END), 0) AS available_chargers,
        ROUND(AVG(r.rating), 1) AS rating,
        COUNT(DISTINCT r.review_id) AS review_count,
        GROUP_CONCAT(DISTINCT c.connector_type) AS connector_types,
        ROUND(
          6371 * ACOS(
            COS(RADIANS(?)) * COS(RADIANS(s.latitude)) *
            COS(RADIANS(s.longitude) - RADIANS(?)) +
            SIN(RADIANS(?)) * SIN(RADIANS(s.latitude))
          ), 2
        ) AS distance_km
      FROM stations s
      LEFT JOIN chargers c ON s.station_id = c.station_id
      LEFT JOIN reviews r ON s.station_id = r.station_id
      GROUP BY s.station_id
      HAVING distance_km <= ?
      ORDER BY distance_km ASC`,
      [latNum, lngNum, latNum, radiusNum]
    )
    return res.status(200).json(rows)
  } catch (error) {
    console.error('Get nearby stations error:', error)
    return res.status(500).json({ message: 'Server error fetching nearby stations.' })
  }
})

/// nem
router.get('/:id', async (req, res) => {
  try {
    const [stationRows] = await pool.query(
      'SELECT * FROM stations WHERE station_id = ?',
      [req.params.id]
    );

    if (stationRows.length === 0) {
      return res.status(404).json({ message: 'Station not found.' });
    }

    const [chargerRows] = await pool.query(
      'SELECT * FROM chargers WHERE station_id = ?',
      [req.params.id]
    );

    return res.status(200).json({
      station: stationRows[0],
      chargers: chargerRows,
    });
  } catch (error) {
    console.error('Get station error:', error);
    return res.status(500).json({ message: 'Server error fetching station.' });
  }
});

/**
 * @swagger
 * /api/stations:
 *   post:
 *     summary: Create a new station (Admin only)
 *     tags: [Stations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, address, latitude, longitude]
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               floor:
 *                 type: string
 *               open_time:
 *                 type: string
 *                 description: Opening time (e.g. 08:00:00)
 *               close_time:
 *                 type: string
 *                 description: Closing time (e.g. 22:00:00)
 *               image:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       201:
 *         description: Station created
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
///lalla
router.post('/', auth, roleCheck('admin'), async (req, res) => {
  const { name, address, latitude, longitude, floor, open_time, close_time, image, status } = req.body;

  if (!name || !address || latitude == null || longitude == null) {
    return res.status(400).json({ message: 'Name, address, latitude, and longitude are required.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO stations (name, address, latitude, longitude, floor, open_time, close_time, image, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, address, latitude, longitude, floor || null, open_time || null, close_time || null, image || null, status || 'active']
    );

    return res.status(201).json({
      message: 'Station created successfully.',
      station_id: result.insertId,
    });
  } catch (error) {
    console.error('Create station error:', error);
    return res.status(500).json({ message: 'Server error creating station.' });
  }
});

/**
 * @swagger
 * /api/stations/{id}:
 *   put:
 *     summary: Update a station (Admin only)
 *     tags: [Stations]
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
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               floor:
 *                 type: string
 *               open_time:
 *                 type: string
 *                 description: Opening time (e.g. 08:00:00)
 *               close_time:
 *                 type: string
 *                 description: Closing time (e.g. 22:00:00)
 *               image:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Station updated
 *       404:
 *         description: Station not found
 *       500:
 *         description: Server error
 */
///lalla   PUT	/api/stations/{id}	Update a station (Admin only)"
router.put('/:id', auth, roleCheck('admin'), async (req, res) => {
  const { name, address, latitude, longitude, floor, open_time, close_time, image, status } = req.body;

  try {
    const [result] = await pool.query(
      `UPDATE stations SET name = ?, address = ?, latitude = ?, longitude = ?,
       floor = ?, open_time = ?, close_time = ?, image = ?, status = ? WHERE station_id = ?`,
      [name, address, latitude, longitude, floor || null, open_time || null, close_time || null, image || null, status || 'active', req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Station not found.' });
    }

    return res.status(200).json({ message: 'Station updated successfully.' });
  } catch (error) {
    console.error('Update station error:', error);
    return res.status(500).json({ message: 'Server error updating station.' });
  }
});

/**
 * @swagger
 * /api/stations/{id}:
 *   delete:
 *     summary: Delete a station (Admin only)
 *     tags: [Stations]
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
 *         description: Station deleted
 *       404:
 *         description: Station not found
 *       500:
 *         description: Server error
 */
// lalla  DELETE	/api/stations/{id}	Delete a station
router.delete('/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM stations WHERE station_id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Station not found.' });
    }

    return res.status(200).json({ message: 'Station deleted successfully.' });
  } catch (error) {
    console.error('Delete station error:', error);
    return res.status(500).json({ message: 'Server error deleting station.' });
  }
});

/**
 * @swagger
 * /api/stations/{id}/stats:
 *   get:
 *     summary: Get station statistics (Admin only)
 *     tags: [Stations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Station ID
 *     responses:
 *       200:
 *         description: Station statistics
 *       403:
 *         description: Access denied
 *       404:
 *         description: Station not found
 *       500:
 *         description: Server error
 */
// lalla GET /api/stations/{id}/stats Get station statistics
router.get('/:id/stats', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { id: stationId } = req.params;

    // 🔴 TODO A: Check station exists
    const [stations] = await pool.query(
      'SELECT station_id, name FROM stations WHERE station_id = ?',
      [stationId]
    );
    if (stations.length === 0) { return res.status(404).json({message: 'Failed'}); }

    // 🔴 TODO B: Count total bookings for this station
    

    const [[{total_bookings}]] = await pool.query(
      `SELECT COUNT(b.booking_id) as total_bookings
      FROM bookings b
      JOIN chargers c ON b.charger_id = c.charger_id
      WHERE c.station_id = ?`,
      [stationId]
    );

    // 🔴 TODO C: Sum total revenue for this station
    

    const [[{ total_revenue }]] = await pool.query(
      `SELECT SUM(p.amount) as total_revenue
        FROM payments p
        JOIN charging_sessions cs ON p.session_id = cs.session_id
        JOIN chargers c ON cs.charger_id = c.charger_id
        WHERE c.station_id = ? AND p.status = 'completed'`,
        [stationId]
    )


    // 🔴 TODO D: Calculate charger availability percentage
    
    const [[{ total_chargers, available_chargers }]] = await pool.query(
      `SELECT
        COUNT(*) as total_chargers,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_chargers
        FROM chargers WHERE station_id = ?`,
        [stationId]
    )

    return res.status(200).json({
      success: true,
      station: stations[0],
      statistics: {
        total_bookings: bookingStats?.total_bookings || 0,
        total_revenue: revenueStats?.total_revenue || 0,
        total_chargers: chargerStats?.total_chargers || 0,
        available_chargers: chargerStats?.available_chargers || 0,
        availability_percentage: chargerStats ?
          (chargerStats.available_chargers / chargerStats.total_chargers * 100).toFixed(2) : 0
      }
    });

  } catch (error) {
    console.error('Get station stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch station statistics',
      error: error.message
    });
  }
});

module.exports = router;
