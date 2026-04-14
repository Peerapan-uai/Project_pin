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
  const { first_name, last_name, phone, current_password, new_password } = req.body;

  try {
    // ถ้าจะเปลี่ยนรหัสผ่าน ต้องตรวจรหัสเก่าก่อน
    if (new_password) {
      if (!current_password) {
        return res.status(400).json({ message: 'กรุณากรอกรหัสผ่านปัจจุบัน' });
      }
      const [rows] = await pool.query('SELECT password_hash FROM users WHERE user_id = ?', [req.user.user_id]);
      const valid = await bcrypt.compare(current_password, rows[0].password_hash);
      if (!valid) {
        return res.status(400).json({ message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
      }
      const password_hash = await bcrypt.hash(new_password, 10);
      await pool.query(
        'UPDATE users SET first_name = ?, last_name = ?, phone = ?, password_hash = ? WHERE user_id = ?',
        [first_name, last_name, phone, password_hash, req.user.user_id]
      );
    } else {
      await pool.query(
        'UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE user_id = ?',
        [first_name, last_name, phone, req.user.user_id]
      );
    }

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
/// Lalla  "Get all users (Admin only)"
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
/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update any user's info (Admin only)
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
 *             required: [first_name, last_name]
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *                 description: ถ้าไม่ส่งมา จะไม่เปลี่ยนรหัสผ่าน
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
///lalla  PUT /api/users/:id  (admin edit any user)
router.put('/:id', auth, roleCheck('admin'), async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, phone, password } = req.body;

  try {
    let query = 'UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE user_id = ?';
    let params = [first_name, last_name, phone, id];

    if (password) {
      const password_hash = await bcrypt.hash(password, 10);
      query = 'UPDATE users SET first_name = ?, last_name = ?, phone = ?, password_hash = ? WHERE user_id = ?';
      params = [first_name, last_name, phone, password_hash, id];
    }

    const [result] = await pool.query(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    return res.status(200).json({ message: 'User updated successfully.' });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ message: 'Server error updating user.' });
  }
});

///lalla  	PATCH /api/users/:id/ban
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
 *             required: [first_name, last_name, email, password]
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
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
///lalla  POST /api/users/technician
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

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
    

    const [result] = await conn.query(
      'INSERT INTO users (first_name, last_name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
      [first_name, last_name, email, password_hash, phone || null, 'technician']
    );

    await conn.query(
      'insert into tech_profiles (user_id) values (?)',
      [result.insertId]
    );

    await conn.commit();
    return res.status(201).json({
      success: true,
      message: "เพิ่มข้อมูลช่างเข้าสู่ระบบเรียบร้อยแล้ว",
      data: {
        user_id: result.insertId
      }
    });

    } catch (error) {
      await conn.rollback();
      return res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง",
        error: error.message
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Create technician error:', error);
    return res.status(500).json({ message: 'Server error creating technician.' });
  }
});

module.exports = router;
