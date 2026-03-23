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
router.get('/', async (req, res) => {
  const { connector_type } = req.query;

  try {
    let query = 'SELECT * FROM stations';
    let params = [];

    if (connector_type) {
      // Filter stations that have at least one charger with the given connector type
      query = `
        SELECT DISTINCT s.* FROM stations s
        INNER JOIN chargers c ON s.station_id = c.station_id
        WHERE c.connector_type = ?
      `;
      params = [connector_type];
    }

    query += ' ORDER BY station_id ASC';

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
 *               description:
 *                 type: string
 *               amenities:
 *                 type: string
 *     responses:
 *       201:
 *         description: Station created
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post('/', auth, roleCheck('admin'), async (req, res) => {
  const { name, address, latitude, longitude, description, amenities } = req.body;

  if (!name || !address || latitude == null || longitude == null) {
    return res.status(400).json({ message: 'Name, address, latitude, and longitude are required.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO stations (name, address, latitude, longitude, description, amenities)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, address, latitude, longitude, description || null, amenities || null]
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
 *               description:
 *                 type: string
 *               amenities:
 *                 type: string
 *     responses:
 *       200:
 *         description: Station updated
 *       404:
 *         description: Station not found
 *       500:
 *         description: Server error
 */
router.put('/:id', auth, roleCheck('admin'), async (req, res) => {
  const { name, address, latitude, longitude, description, amenities } = req.body;

  try {
    const [result] = await pool.query(
      `UPDATE stations SET name = ?, address = ?, latitude = ?, longitude = ?,
       description = ?, amenities = ? WHERE station_id = ?`,
      [name, address, latitude, longitude, description || null, amenities || null, req.params.id]
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

module.exports = router;
