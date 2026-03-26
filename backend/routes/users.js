const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get the authenticated user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
/// nem
router.get('/profile', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT user_id, first_name, last_name ,email, phone, role, created_at FROM users WHERE user_id = ?',
      [req.user.user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json({ user: rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ message: 'Server error fetching profile.' });
  }
});

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update the authenticated user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *       500:
 *         description: Server error
 */
/// nem
router.put('/profile', auth, async (req, res) => {
  const { first_name, last_name,phone, password } = req.body;

  try {
    let query = 'UPDATE users SET first_name = ?, last_name =? ,phone = ? WHERE user_id = ?';
    let params = [first_name, last_name,phone,req.user.user_id];

    if (password) {
      const password_hash = await bcrypt.hash(password, 10);
      query = 'UPDATE users SET first_name = ?, last_name =? ,phone = ?, password_hash = ? WHERE user_id = ?';
      params = [first_name, last_name ,phone, password_hash ,req.user.user_id];
    }

    await pool.query(query, params);
    return res.status(200).json({ message: 'Profile updated successfully.' });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Server error updating profile.' });
  }
});

/**
 * @swagger
 * /api/users/profile:
 *   delete:
 *     summary: Delete the authenticated user's own account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted
 *       500:
 *         description: Server error
 */
/// nem
router.delete('/profile', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE user_id = ?', [req.user.user_id]);
    return res.status(200).json({ message: 'Account deleted successfully.' });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({ message: 'Server error deleting account.' });
  }
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
/// Lalla
router.get('/', auth, roleCheck('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT user_id, first_name, last_name, email, phone, role, is_banned, created_at FROM users ORDER BY created_at DESC'
    );
    return res.status(200).json({ users: rows });
  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({ message: 'Server error fetching users.' });
  }
});

/**
 * @swagger
 * /api/users/{id}/ban:
 *   patch:
 *     summary: Ban or unban a user (Admin only)
 *     tags: [Users]
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
 *             required: [is_banned]
 *             properties:
 *               is_banned:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User ban status updated
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/ban', auth, roleCheck('admin'), async (req, res) => {
  const { id } = req.params;
  const { is_banned } = req.body;

  try {
    const [result] = await pool.query(
      'UPDATE users SET is_banned = ? WHERE user_id = ?',
      [is_banned ? 1 : 0, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json({
      message: `User ${is_banned ? 'banned' : 'unbanned'} successfully.`,
    });
  } catch (error) {
    console.error('Ban user error:', error);
    return res.status(500).json({ message: 'Server error updating ban status.' });
  }
});

/**
 * @swagger
 * /api/users/technician:
 *   post:
 *     summary: Create a technician account (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Technician created
 *       400:
 *         description: Email already exists
 *       500:
 *         description: Server error
 */
router.post('/technician', auth, roleCheck('admin'), async (req, res) => {
  const { first_name, last_name, email, password, phone } = req.body;

  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ message: 'first_name, last_name, email, and password are required.' });
  }

  try {
    const [existing] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (first_name, last_name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
      [first_name, last_name, email, password_hash, phone || null, 'technician']
    );

    return res.status(201).json({
      message: 'Technician account created successfully.',
      user_id: result.insertId,
    });
  } catch (error) {
    console.error('Create technician error:', error);
    return res.status(500).json({ message: 'Server error creating technician.' });
  }
});

module.exports = router;
