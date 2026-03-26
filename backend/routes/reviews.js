const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Station review endpoints
 */

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Post a review for a station
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [station_id, rating]
 *             properties:
 *               station_id:
 *                 type: integer
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review posted
 *       400:
 *         description: Missing required fields or invalid rating
 *       500:
 *         description: Server error
 */
router.post('/', auth, async (req, res) => {
  const { station_id, rating, comment } = req.body;
  // บังคับให้ส่งมาทั้งคู่ แต่ไม่ต้องคอมเม้นก็ได้
  if (!station_id || !rating) {
    return res.status(400).json({ message: 'station_id and rating are required.' });
  }
    
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
  }

  try {
    // เช็คว่ามีสถานีอยู่มีอยู่จริงไหม?
    const [stationRows] = await pool.query(
      'SELECT station_id FROM stations WHERE station_id = ?',
      [station_id]
    );

    if (stationRows.length === 0) {
      return res.status(404).json({ message: 'Station not found.' });
    }

    // เช็ค หuser เคยรีวิวสถานีนี้ไปแล้วไหม?
    const [existing] = await pool.query(
      'SELECT review_id FROM reviews WHERE user_id = ? AND station_id = ?',
      [req.user.user_id, station_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'You have already reviewed this station.' });
    }

    const [result] = await pool.query(
      `INSERT INTO reviews (user_id, station_id, rating, comment)
       VALUES (?, ?, ?, ?)`,
      [req.user.user_id, station_id, rating, comment || null]
    );

    return res.status(201).json({
      message: 'Review posted successfully.',
      review_id: result.insertId,
    });
  } catch (error) {
    console.error('Post review error:', error);
    return res.status(500).json({ message: 'Server error posting review.' });
  }
});

/**
 * @swagger
 * /api/reviews/station/{stationId}:
 *   get:
 *     summary: Get all reviews for a station
 *     tags: [Reviews]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: stationId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of reviews with average rating
 *       500:
 *         description: Server error
 */
router.get('/station/:stationId', async (req, res) => {
  try {
    const [reviews] = await pool.query(
      `SELECT r.review_id, r.rating, r.comment, r.created_at,
            CONCAT(u.first_name, ' ', u.last_name) AS reviewer_name
       FROM reviews r
       JOIN users u ON r.user_id = u.user_id
       WHERE r.station_id = ?
       ORDER BY r.created_at DESC`,
      [req.params.stationId]
    );
    //คะแนนเฉลี่ย
    // AVG(rating) เฉลี่ยคะแนนทุกรีวิวของสถานีนี้
    // COUNT(*)  นับจำนวนรีวิวทั้งหมด
    const [avgResult] = await pool.query(
      'SELECT AVG(rating) AS average_rating, COUNT(*) AS total_reviews FROM reviews WHERE station_id = ?',
      [req.params.stationId]
    );

    return res.status(200).json({
      reviews,
      average_rating: avgResult[0].average_rating
        ? parseFloat(parseFloat(avgResult[0].average_rating).toFixed(2))
        : null,
      // total_reviews คือจำนวนรีวิวทั้งหมด
      total_reviews: avgResult[0].total_reviews,
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    return res.status(500).json({ message: 'Server error fetching reviews.' });
  }
});

/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     summary: Delete a review (own review or admin)
 *     tags: [Reviews]
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
 *         description: Review deleted
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Review not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM reviews WHERE review_id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      // 404 = ไม่เจอรีวิว id นี้ใน db ส่ง404 กลับเพราะลบสิ่งที่มไ่มีอยู่ไม่ได้
      return res.status(404).json({ message: 'Review not found.' });
    }

    const review = rows[0];

    if (review.user_id !== req.user.user_id && req.user.role !== 'admin') {
      // 403 = ไม่มีสิทธิ์
      return res.status(403).json({ message: 'Not authorized to delete this review.' });
    }

    await pool.query('DELETE FROM reviews WHERE review_id = ?', [req.params.id]);

    return res.status(200).json({ message: 'Review deleted successfully.' });
  } catch (error) {
    console.error('Delete review error:', error);
    return res.status(500).json({ message: 'Server error deleting review.' });
  }
});

module.exports = router;
