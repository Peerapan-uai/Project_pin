const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

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
