const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     summary: Get user's favorite stations
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of favorite stations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 favorites:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       station_id:   { type: integer, example: 12 }
 *                       name:         { type: string, example: "PEA Volta ลาดกระบัง" }
 *                       address:      { type: string }
 *                       image:        { type: string, nullable: true }
 *                       status:       { type: string }
 *                       latitude:     { type: number, format: float }
 *                       longitude:    { type: number, format: float }
 *                       favorited_at: { type: string, format: date-time }
 *       401: { description: ไม่มี token / token หมดอายุ }
 *       500: { description: Server error }
 */

router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.station_id, s.name, s.address, s.image, s.status,
              s.latitude, s.longitude, uf.created_at AS favorited_at
       FROM user_favorites uf
       JOIN stations s ON s.station_id = uf.station_id
       WHERE uf.user_id = ?
       ORDER BY uf.created_at DESC`,
      [req.user.user_id]
    );
    return res.status(200).json({ favorites: rows });
  } catch (error) {
    console.error('Get favorites error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
});

/**
 * @swagger
 * /api/favorites:
 *   post:
 *     summary: Add a station to user's favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [station_id]
 *             properties:
 *               station_id:
 *                 type: integer
 *                 example: 12
 *     responses:
 *       201:
 *         description: Added to favorites
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Added to favorites." }
 *       400: { description: ไม่ได้ส่ง station_id }
 *       401: { description: ไม่มี token / token หมดอายุ }
 *       500: { description: Server error }
 */



router.post('/', auth, async (req, res) => {
  const { station_id } = req.body;
  if (!station_id) return res.status(400).json({ message: 'station_id is required.' });
  try {
    await pool.query(
      `INSERT IGNORE INTO user_favorites (user_id, station_id) VALUES (?, ?)`,
      [req.user.user_id, station_id]
    );
    return res.status(201).json({ message: 'Added to favorites.' });
  } catch (error) {
    console.error('Add favorite error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
});

/**
 * @swagger
 * /api/favorites/{station_id}:
 *   delete:
 *     summary: Remove a station from user's favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: station_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the station to remove from favorites
 *     responses:
 *       200:
 *         description: Removed from favorites
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Removed from favorites." }
 *       401: { description: ไม่มี token / token หมดอายุ }
 *       500: { description: Server error }
 */
router.delete('/:station_id', auth, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM user_favorites WHERE user_id = ? AND station_id = ?`,
      [req.user.user_id, req.params.station_id]
    );
    return res.status(200).json({ message: 'Removed from favorites.' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
