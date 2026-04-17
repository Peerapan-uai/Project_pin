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
      'SELECT u.*, tp.specialty, tp.can_field_work FROM users u left join tech_profiles tp on u.user_id = tp.user_id'
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


/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user detail + full history (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User detail with history
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/:id', auth, roleCheck('admin', 'technician'), async (req,res) => {
  const { id } = req.params;

  try {
    const [user] = await pool.query (
      `select u.user_id, u.email, u.first_name, u.last_name, u.phone, u.role,
        u.wallet_balance, u.wallet_frozen, u.is_banned, u.ban_reason, u.created_at,
        tp.specialty, tp.can_field_work
      from users u
      left join tech_profiles tp on u.user_id = tp.user_id
      where u.user_id = ?`, [id]
    );
    if (user.length === 0) {
      return res.status(404).json({
       success: false ,
       message: "User not found" 
      });
    } 
    const [bookings] = await pool.query (
      `select booking_id , b.charger_id , b.start_time , 
      b.booking_time, b.status, s.name AS station_name
      from bookings b
      join chargers c on b.charger_id = c.charger_id
      join stations s on c.station_id = s.station_id
      where b.user_id = ? 
      order by b.booking_time DESC
      LIMIT 20 `, [id]
    )
    const [payments] = await pool.query(
      `select payment_id, amount, method, status, transaction_ref, paid_at
      from payments where user_id = ?
      order by paid_at DESC limit 20`, [id]
    )
    const [sessions] = await pool.query(
      `select cs.session_id, cs.charger_id, cs.start_time, cs.end_time, 
        cs.energy_kwh, cs.charge_percentage, cs.status, s.name as station_name
        from charging_sessions cs
        join chargers c on cs.charger_id = c.charger_id
        join stations s on c.station_id = s.station_id
        where cs.user_id = ?
        order by cs.start_time DESC limit 20`, [id]
    )
    const [review] = await pool.query(
      `select r.review_id, r.station_id, r.rating, r.comment, r.created_at, s.name as station_name
      from reviews r
      join stations s on r.station_id = s.station_id
      where r.user_id = ?
      order by r.created_at DESC limit 20`, [id]
    )
    const [wallet_transactions] = await pool.query(
      `select txn_id, amount, type, reason, ref , created_at
      from wallet_transactions where user_id = ?
      order by created_at DESC limit 20`, [id]
    )
    return res.json({
      success: true,
      user : user[0],
      bookings,
      payments,
      sessions,
      wallet_transactions: wallet_transactions,
      review
    })
  } catch (error) {
    console.error('Get user detail error:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล',
      error: error.message
    });
  }
})
  





/// lalla DELETE /api/users/:id (admin ลบ user/technician)
router.delete('/:id', auth, roleCheck('admin'), async (req, res) => {
  const { id } = req.params
  try {
    const [result] = await pool.query('DELETE FROM users WHERE user_id = ?', [id])
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found.' })
    }
    return res.status(200).json({ message: 'User deleted successfully.' })
  } catch (error) {
    console.error('Delete user error:', error)
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบ user' })
  }
})

///lalla  PUT /api/users/:id  (admin edit any user)
router.put('/:id', auth, roleCheck('admin'), async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, phone, password, specialty } = req.body;

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

    if (specialty !== undefined) {
      await pool.query(
        'UPDATE tech_profiles SET specialty = ? WHERE user_id = ?',
        [specialty || null, id]
      )
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
  const { first_name, last_name, email, password, phone, specialty } = req.body;

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

    if (specialty) {
      await conn.query(
        `INSERT INTO tech_profiles (user_id, specialty) VALUES (?, ?)`,
        [result.insertId, specialty]
      );
    }

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

// ช่างกดเปลี่ยนสถานะตัวเอง AVAILABLE ↔ OFFLINE
router.patch('/me/status', auth, roleCheck('technician'), async (req, res) => {
  const { status } = req.body;
  if (!['AVAILABLE', 'OFFLINE'].includes(status)) {
    return res.status(400).json({ message: 'status ต้องเป็น AVAILABLE หรือ OFFLINE' });
  }
  try {
    await pool.query(
      `update tech_profiles set status = ? where user_id = ?`,
      [status, req.user.user_id]
    );
    return res.json({ message: 'อัพเดตสถานะแล้ว', status });
  } catch (error) {
    return res.status(500).json({ message: 'server error' });
  }
});









module.exports = router;
