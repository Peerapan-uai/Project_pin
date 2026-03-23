const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Vehicles
 *   description: Vehicle management for authenticated users
 */

/**
 * @swagger
 * /api/vehicles:
 *   get:
 *     summary: Get all vehicles belonging to the authenticated user
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's vehicles
 *       500:
 *         description: Server error
 */
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM vehicles WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.user_id]
    );
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Get vehicles error:', error);
    return res.status(500).json({ message: 'Server error fetching vehicles.' });
  }
});

/**
 * @swagger
 * /api/vehicles/{id}:
 *   get:
 *     summary: Get a specific vehicle by ID (must belong to user)
 *     tags: [Vehicles]
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
 *         description: Vehicle data
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Server error
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM vehicles WHERE vehicle_id = ? AND user_id = ?',
      [req.params.id, req.user.user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found.' });
    }

    return res.status(200).json({ vehicle: rows[0] });
  } catch (error) {
    console.error('Get vehicle error:', error);
    return res.status(500).json({ message: 'Server error fetching vehicle.' });
  }
});

/**
 * @swagger
 * /api/vehicles:
 *   post:
 *     summary: Add a new vehicle for the authenticated user
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [make, model, year, license_plate, connector_type]
 *             properties:
 *               make:
 *                 type: string
 *               model:
 *                 type: string
 *               year:
 *                 type: integer
 *               license_plate:
 *                 type: string
 *               connector_type:
 *                 type: string
 *                 enum: [CCS, CHAdeMO, Type2, Tesla]
 *               battery_capacity_kwh:
 *                 type: number
 *     responses:
 *       201:
 *         description: Vehicle added
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post('/', auth, async (req, res) => {
  const { make, model, year, license_plate, connector_type, battery_capacity_kwh } = req.body;

  if (!make || !model || !year || !license_plate || !connector_type) {
    return res.status(400).json({ message: 'Make, model, year, license plate, and connector type are required.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO vehicles (user_id, make, model, year, license_plate, connector_type, battery_capacity_kwh)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.user_id, make, model, year, license_plate, connector_type, battery_capacity_kwh || null]
    );

    return res.status(201).json({
      message: 'Vehicle added successfully.',
      vehicle_id: result.insertId,
    });
  } catch (error) {
    console.error('Add vehicle error:', error);
    return res.status(500).json({ message: 'Server error adding vehicle.' });
  }
});

/**
 * @swagger
 * /api/vehicles/{id}:
 *   put:
 *     summary: Update a vehicle (must belong to user)
 *     tags: [Vehicles]
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
 *               make:
 *                 type: string
 *               model:
 *                 type: string
 *               year:
 *                 type: integer
 *               license_plate:
 *                 type: string
 *               connector_type:
 *                 type: string
 *               battery_capacity_kwh:
 *                 type: number
 *     responses:
 *       200:
 *         description: Vehicle updated
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Server error
 */
router.put('/:id', auth, async (req, res) => {
  const { make, model, year, license_plate, connector_type, battery_capacity_kwh } = req.body;

  try {
    const [result] = await pool.query(
      `UPDATE vehicles SET make = ?, model = ?, year = ?, license_plate = ?,
       connector_type = ?, battery_capacity_kwh = ? WHERE vehicle_id = ? AND user_id = ?`,
      [make, model, year, license_plate, connector_type, battery_capacity_kwh || null, req.params.id, req.user.user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Vehicle not found or not owned by you.' });
    }

    return res.status(200).json({ message: 'Vehicle updated successfully.' });
  } catch (error) {
    console.error('Update vehicle error:', error);
    return res.status(500).json({ message: 'Server error updating vehicle.' });
  }
});

/**
 * @swagger
 * /api/vehicles/{id}:
 *   delete:
 *     summary: Delete a vehicle (must belong to user)
 *     tags: [Vehicles]
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
 *         description: Vehicle deleted
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM vehicles WHERE vehicle_id = ? AND user_id = ?',
      [req.params.id, req.user.user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Vehicle not found or not owned by you.' });
    }

    return res.status(200).json({ message: 'Vehicle deleted successfully.' });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    return res.status(500).json({ message: 'Server error deleting vehicle.' });
  }
});

module.exports = router;
