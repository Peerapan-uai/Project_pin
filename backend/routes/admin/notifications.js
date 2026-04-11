const express = require('express');
const router = express.Router();
const pool = require('../../config/db');
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');

/**
 * @swagger
 * tags:
 *   name: Admin Notifications
 *   description: Notification management endpoints (Admin only)
 */

/**
 * @swagger
 * /api/admin/notifications/broadcast:
 *   post:
 *     summary: Send broadcast notification to all users (Admin only)
 *     tags: [Admin Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, message]
 *             properties:
 *               title:
 *                 type: string
 *                 description: Notification title
 *               message:
 *                 type: string
 *                 description: Notification message
 *               type:
 *                 type: string
 *                 enum: [booking, charging, payment, maintenance, system]
 *                 default: system
 *     responses:
 *       200:
 *         description: Broadcast sent successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
// lalla POST /api/notifications/broadcast
router.post('/broadcast', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { title, message, type = 'system' } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'title and message are required'
      });
    }

    const [users] = await pool.query(
    'SELECT user_id FROM users WHERE role = ?', ['user']);


    const insertValues = users.map(u => [u.user_id, title, message, type]);
    const [result] = await pool.query(
    'INSERT INTO notifications (user_id, title, message, type) VALUES ?',
    [insertValues] );
    
    const sentCount = result.affectedRows;

    return res.status(200).json({
      success: true,
      message: 'Broadcast notification sent',
      recipients_count: sentCount
    });

  } catch (error) {
    console.error('Broadcast notification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send broadcast notification',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/notifications/targeted:
 *   post:
 *     summary: Send targeted notification to specific users (Admin only)
 *     tags: [Admin Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, message, target_type]
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               target_type:
 *                 type: string
 *                 enum: [role, user_ids]
 *                 description: 'role: by user role, user_ids: specific users'
 *               target_value:
 *                 type: string
 *                 description: 'role value (user/admin/technician) or comma-separated user IDs'
 *               type:
 *                 type: string
 *                 enum: [booking, charging, payment, maintenance, system]
 *                 default: system
 *     responses:
 *       200:
 *         description: Notification sent
 *       400:
 *         description: Invalid parameters
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
// lalla POST /api/notifications/targeted
router.post('/targeted', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { title, message, target_type, target_value, type = 'system' } = req.body;

    if (!title || !message || !target_type || !target_value) {
      return res.status(400).json({
        success: false,
        message: 'title, message, target_type, and target_value are required'
      });
    }

    // 🔴 TODO D: Build WHERE clause based on target_type
    let query;
    let queryParams = [];

    if (target_type === 'role') {
      query = 'SELECT user_id FROM users WHERE role = ?';
      queryParams = [target_value];
    } else if (target_type === 'user_ids') {
      const userIds = target_value.split(',').map(id => parseInt(id.trim()));
      const placeholders = userIds.map(() => '?').join(',');
      query = `SELECT user_id FROM users WHERE user_id IN (${placeholders})`;
      queryParams = userIds;
    }

    const [targetedUsers] = await pool.query(query, queryParams);

    // 🔴 TODO E: INSERT notifications for targeted users
    const insertValues = targetedUsers.map(u => [u.user_id, title, message, type]);
    const [result] = await pool.query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES ?',
      [insertValues]
    );
    const sentCount = result.affectedRows;

    return res.status(200).json({
      success: true,
      message: 'Targeted notification sent',
      recipients_count: sentCount
    });

  } catch (error) {
    console.error('Targeted notification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send targeted notification',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/notifications/schedule:
 *   post:
 *     summary: Schedule notification to be sent at specific time (Admin only)
 *     tags: [Admin Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, message, scheduled_at, target_type]
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               scheduled_at:
 *                 type: string
 *                 format: date-time
 *                 description: ISO 8601 format (2026-04-15T10:30:00Z)
 *               target_type:
 *                 type: string
 *                 enum: [all, role, user_ids]
 *               target_value:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [booking, charging, payment, maintenance, system]
 *     responses:
 *       200:
 *         description: Notification scheduled
 *       400:
 *         description: Invalid parameters
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
// lalla POST /api/notifications/schedule
router.post('/schedule', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { title, message, scheduled_at, target_type, target_value, type = 'system' } = req.body;

    if (!title || !message || !scheduled_at || !target_type) {
      return res.status(400).json({
        success: false,
        message: 'title, message, scheduled_at, and target_type are required'
      });
    }

    // 🔴 TODO F: Validate scheduled_at is in the future
    const scheduledDate = new Date(scheduled_at);
    if (scheduledDate <= new Date()) {
      return res.status(400).json({ message: 'scheduled_at must be in the future' });
    }

        // 🔴 TODO G: Create scheduled notification record (store in DB for later processing)
        const [result] = await pool.query('INSERT INTO scheduled_notifications (title, message, scheduled_at, target_type, target_value, type, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, message, scheduled_at, target_type, target_value || null, type, req.user.user_id]
    );


    return res.status(200).json({
      success: true,
      message: 'Notification scheduled successfully',
      scheduled_at: scheduled_at
    });

  } catch (error) {
    console.error('Schedule notification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to schedule notification',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/notifications/analytics:
 *   get:
 *     summary: Get notification delivery and read statistics (Admin only)
 *     tags: [Admin Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date
 *         description: YYYY-MM-DD
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date
 *         description: YYYY-MM-DD
 *     responses:
 *       200:
 *         description: Notification analytics
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
// lalla GET /api/notifications/analytics
router.get('/analytics', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    const fromDate = from_date ? new Date(from_date) : new Date(new Date().getTime() - 30 * 24 * 60 * 1000);
    const toDate = to_date ? new Date(to_date) : new Date();

    // 🔴 TODO H: Query notification stats (total, read, unread)
    const [[totalStats]] = await pool.query(
      `SELECT
        COUNT(*) as total_notifications,
        SUM(CASE WHEN is_read = 1 THEN 1 ELSE 0 END) as read_count,
        SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread_count
      FROM notifications
      WHERE created_at >= ? AND created_at <= ?`,
      [fromDate, toDate]
    );

    // 🔴 TODO I: Query by type
    const [typeStats] = await pool.query(
      `SELECT
        type,
        COUNT(*) as count,
        SUM(CASE WHEN is_read = 1 THEN 1 ELSE 0 END) as read_count
      FROM notifications
      WHERE created_at >= ? AND created_at <= ?
      GROUP BY type`,
      [fromDate, toDate]
    );

    // 🔴 TODO J: Calculate read rate percentage
   const readRate = totalStats?.total_notifications > 0
    ? (totalStats.read_count / totalStats.total_notifications * 100).toFixed(2): 0;

    return res.status(200).json({
      success: true,
      period: `${fromDate.toISOString().split('T')[0]} to ${toDate.toISOString().split('T')[0]}`,
      summary: {
        total_notifications: totalStats?.total_notifications || 0,
        read_count: totalStats?.read_count || 0,
        unread_count: totalStats?.unread_count || 0,
        read_rate_percentage: readRate
      },
      by_type: typeStats
    });

  } catch (error) {
    console.error('Notification analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notification analytics',
      error: error.message
    });
  }
});

module.exports = router;
