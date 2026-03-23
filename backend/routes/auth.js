const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
require('dotenv').config();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
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
 *         description: User registered successfully
 *       400:
 *         description: Email already exists
 *       500:
 *         description: Server error
 */
router.post('/register', async (req, res) => {
  const { first_name, last_name, email, password, phone } = req.body;

  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  try {
    // Check if email already exists
    const [existing] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insert new user with default role 'user'
    const [result] = await pool.query(
      'INSERT INTO users (first_name, last_name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
      [first_name, last_name, email, password_hash, phone || null, 'user']
    );

    const userId = result.insertId;

    // Generate JWT
    const token = jwt.sign(
      { user_id: userId, email, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return res.status(201).json({
      message: 'User registered successfully.',
      token,
      user: { user_id: userId, name: `${first_name} ${last_name}`, email, role: 'user' },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Server error during registration.' });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login and receive a JWT
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, returns JWT
 *       400:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT user_id, first_name, last_name, email, password_hash, role, is_banned FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const user = rows[0];

    if (user.is_banned) {
      return res.status(403).json({ message: 'Your account has been banned.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        user_id: user.user_id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login.' });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout (stateless — client discards token)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', (req, res) => {
  // JWT is stateless; the client is responsible for discarding the token.
  return res.status(200).json({ message: 'Logged out successfully.' });
});

module.exports = router;
