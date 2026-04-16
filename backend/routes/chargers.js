const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

/**
 * @swagger
 * tags:
 *   name: Chargers
 *   description: Charger management endpoints
 */

/**
 * @swagger
 * /api/chargers/station/{stationId}:
 *   get:
 *     summary: Get all chargers for a specific station
 *     tags: [Chargers]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: stationId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of chargers
 *       500:
 *         description: Server error
 */
///lalla  GET /api/chargers — Admin: get all chargers
router.get('/', auth, roleCheck('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, s.name AS station_name
       FROM chargers c
       JOIN stations s ON c.station_id = s.station_id
       ORDER BY c.station_id ASC, c.charger_id ASC`
    );
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Get all chargers error:', error);
    return res.status(500).json({ message: 'Server error fetching chargers.' });
  }
});

/// nem
router.get('/station/:stationId', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM chargers WHERE station_id = ? ORDER BY charger_id ASC',
      [req.params.stationId]
    );
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Get chargers by station error:', error);
    return res.status(500).json({ message: 'Server error fetching chargers.' });
  }
});

/**
 * @swagger
 * /api/chargers/{id}:
 *   get:
 *     summary: Get a charger by ID
 *     tags: [Chargers]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Charger data
 *       404:
 *         description: Charger not found
 *       500:
 *         description: Server error
 */
/// nem
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM chargers WHERE charger_id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Charger not found.' });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Get charger error:', error);
    return res.status(500).json({ message: 'Server error fetching charger.' });
  }
});

/**
 * @swagger
 * /api/chargers:
 *   post:
 *     summary: Add a new charger to a station (Admin only)
 *     tags: [Chargers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [station_id, charger_name, connector_type, power_kw, status, qr_code]
 *             properties:
 *               station_id:
 *                 type: integer
 *               charger_name:
 *                 type: string
 *               connector_type:
 *                 type: string
 *                 enum: [CCS, CHAdeMO, Type2, Type1]
 *               power_kw:
 *                 type: number
 *               price_per_kwh:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [available, reserved, charging, out_of_service]
 *               qr_code:
 *                 type: string
 *     responses:
 *       201:
 *         description: Charger created
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */

///lalla. POST	/api/chargers	Add a new charger
router.post('/', auth, roleCheck('admin'), async (req, res) => {
  const { station_id, charger_name, connector_type, power_kw, price_per_kwh, status, qr_code } = req.body;

  if (!station_id || !charger_name || !connector_type || !power_kw) {
    return res.status(400).json({ message: 'station_id, charger_name, connector_type, and power_kw are required.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO chargers (station_id, charger_name, connector_type, power_kw, price_per_kwh, status, qr_code)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [station_id, charger_name, connector_type, power_kw, price_per_kwh, status, qr_code || null]
    );

    return res.status(201).json({
      message: 'Charger created successfully.',
      charger_id: result.insertId,
    });
  } catch (error) {
    console.error('Create charger error:', error);
    return res.status(500).json({ message: 'Server error creating charger.' });
  }
});


/**
 * @swagger
 * /api/chargers/{id}:
 *   put:
 *     summary: Update charger details (Admin only)
 *     tags: [Chargers]
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
 *               charger_name:
 *                 type: string
 *               connector_type:
 *                 type: string
 *                 enum: [CCS, CHAdeMO, Type2, Type1]
 *               power_kw:
 *                 type: number
 *               price_per_kwh:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [available, reserved, charging, out_of_service]
 *               qr_code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Charger updated
 *       404:
 *         description: Charger not found
 *       500:
 *         description: Server error
 */

///lalla  PUT	/api/chargers/{id}	Update charger info
router.put('/:id', auth, roleCheck('admin'), async (req, res) => {
  const { charger_name, connector_type, power_kw, price_per_kwh } = req.body;

  try {
    const { status } = req.body;
    const [result] = await pool.query(
      `UPDATE chargers SET charger_name = ?, connector_type = ?, power_kw = ?, price_per_kwh = ?, status = COALESCE(?, status)
       WHERE charger_id = ?`,
      [charger_name || null, connector_type, power_kw, price_per_kwh || null, status || null, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Charger not found.' });
    }

    return res.status(200).json({ message: 'Charger updated successfully.' });
  } catch (error) {
    console.error('Update charger error:', error);
    return res.status(500).json({ message: 'Server error updating charger.' });
  }
});

/**
 * @swagger
 * /api/chargers/{id}/status:
 *   patch:
 *     summary: Update charger status (Admin or Technician)
 *     tags: [Chargers]
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [available, reserved, charging, out_of_service]
 *     responses:
 *       200:
 *         description: Charger status updated
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Charger not found
 *       500:
 *         description: Server error
 */
///lalla   PATCH	/api/chargers/{id}/status	Update charger status
router.patch('/:id/status', auth, roleCheck('admin', 'technician'), async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['available', 'reserved', 'charging', 'out_of_service'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}.`,
    });
  }

  try {
    const [result] = await pool.query(
      'UPDATE chargers SET status = ? WHERE charger_id = ?',
      [status, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Charger not found.' });
    }

    return res.status(200).json({ message: 'Charger status updated successfully.' });
  } catch (error) {
    console.error('Update charger status error:', error);
    return res.status(500).json({ message: 'Server error updating charger status.' });
  }
});
///lalla  DELETE /api/chargers/:id — Admin: delete charger
router.delete('/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM chargers WHERE charger_id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Charger not found.' });
    }

    return res.status(200).json({ message: 'Charger deleted successfully.' });
  } catch (error) {
    console.error('Delete charger error:', error);
    return res.status(500).json({ message: 'Server error deleting charger.' });
  }
});

module.exports = router;
