const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: User notification endpoints
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get all notifications for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 *       500:
 *         description: Server error
 */
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.user_id]
    );

    const unreadCount = rows.filter((n) => !n.is_read).length;

    return res.status(200).json({
      notifications: rows,
      unread_count: unreadCount,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ message: 'Server error fetching notifications.' });
  }
});

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark a specific notification as read
 *     tags: [Notifications]
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
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       500:
 *         description: Server error
 */
// NOTE: /read-all must be declared BEFORE /:id/read to avoid Express matching "read-all" as an id param
router.patch('/read-all', auth, async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = 1
       WHERE user_id = ? AND is_read = 0`,
      [req.user.user_id]
    );

    return res.status(200).json({ message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    return res.status(500).json({ message: 'Server error updating notifications.' });
  }
});

router.patch('/:id/read', auth, async (req, res) => {
  try {
    const [result] = await pool.query(
      `UPDATE notifications SET is_read = 1
       WHERE notification_id = ? AND user_id = ?`,
      [req.params.id, req.user.user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    return res.status(200).json({ message: 'Notification marked as read.' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return res.status(500).json({ message: 'Server error updating notification.' });
  }
});

module.exports = router;
