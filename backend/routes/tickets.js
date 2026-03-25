const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Support ticket endpoints
 */

// Multer storage configuration for ticket images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'tickets');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `ticket-${req.params.id}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase()) &&
                    allowedTypes.test(file.mimetype);
    if (isValid) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed.'));
    }
  },
});

/**
 * @swagger
 * /api/tickets:
 *   post:
 *     summary: Create a support ticket
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject, description]
 *             properties:
 *               subject:
 *                 type: string
 *               description:
 *                 type: string
 *               charger_id:
 *                 type: integer
 *               station_id:
 *                 type: integer
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *     responses:
 *       201:
 *         description: Ticket created
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post('/', auth, async (req, res) => {
  const { subject, description, charger_id, station_id, priority } = req.body;

  if (!subject || !description) {
    return res.status(400).json({ message: 'Subject and description are required.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO tickets (user_id, subject, description, charger_id, station_id, priority, status)
       VALUES (?, ?, ?, ?, ?, ?, 'open')`,
      [
        req.user.user_id,
        subject,
        description,
        charger_id || null,
        station_id || null,
        priority || 'medium',
      ]
    );

    return res.status(201).json({
      message: 'Support ticket created successfully.',
      ticket_id: result.insertId,
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    return res.status(500).json({ message: 'Server error creating ticket.' });
  }
});

/**
 * @swagger
 * /api/tickets:
 *   get:
 *     summary: Get tickets (own tickets for customers; all for admin/tech)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tickets
 *       500:
 *         description: Server error
 */
router.get('/', auth, async (req, res) => {
  try {
    let query;
    let params;

    if (req.user.role === 'admin' || req.user.role === 'technician') {
      query = `
        SELECT t.*, CONCAT(u.first_name, ' ', u.last_name) AS submitted_by,
               CONCAT(tech.first_name, ' ', tech.last_name) AS assigned_to_name
        FROM maintenance_tickets t
        JOIN users u ON t.reported_by = u.user_id
        LEFT JOIN users tech ON t.assigned_to = tech.user_id
        ORDER BY t.created_at DESC
      `;
      params = [];
    } else {
      query = `
        SELECT t.*, CONCAT(tech.first_name, ' ', tech.last_name) AS assigned_to_name
        FROM maintenance_tickets t
        LEFT JOIN users tech ON t.assigned_to = tech.user_id
        WHERE t.reported_by = ?
        ORDER BY t.created_at DESC
      `;
      params = [req.user.user_id];
    }

    const [rows] = await pool.query(query, params);
    return res.status(200).json({ tickets: rows });
  } catch (error) {
    console.error('Get tickets error:', error);
    return res.status(500).json({ message: 'Server error fetching tickets.' });
  }
});

/**
 * @swagger
 * /api/tickets/{id}/assign:
 *   patch:
 *     summary: Assign a ticket to a technician (Admin only)
 *     tags: [Tickets]
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
 *             required: [technician_id]
 *             properties:
 *               technician_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Ticket assigned
 *       404:
 *         description: Ticket not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/assign', auth, roleCheck('admin'), async (req, res) => {
  const { technician_id } = req.body;

  if (!technician_id) {
    return res.status(400).json({ message: 'technician_id is required.' });
  }

  try {
    // Verify technician exists and has the right role
    const [techRows] = await pool.query(
      `SELECT user_id FROM users WHERE user_id = ? AND role = 'technician'`,
      [technician_id]
    );

    if (techRows.length === 0) {
      return res.status(404).json({ message: 'Technician not found.' });
    }

    const [result] = await pool.query(
      `UPDATE maintenance_tickets SET assigned_to = ?, status = 'assigned' WHERE ticket_id = ?`,
      [technician_id, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }

    return res.status(200).json({ message: 'Ticket assigned successfully.' });
  } catch (error) {
    console.error('Assign ticket error:', error);
    return res.status(500).json({ message: 'Server error assigning ticket.' });
  }
});

/**
 * @swagger
 * /api/tickets/{id}/status:
 *   patch:
 *     summary: Update ticket status (Technician)
 *     tags: [Tickets]
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [open, in_progress, resolved, closed]
 *               resolution_notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ticket status updated
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Ticket not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/status', auth, roleCheck('admin', 'technician'), async (req, res) => {
  const { status, resolution_notes } = req.body;
  const validStatuses = ['reported','assigned', 'in_progress', 'completed'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}.`,
    });
  }

  try {
    const [result] = await pool.query(
      `UPDATE maintenance_tickets SET status = ?, repair_notes = ? WHERE ticket_id = ?`,
      [status, resolution_notes || null, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }

    return res.status(200).json({ message: 'Ticket status updated successfully.' });
  } catch (error) {
    console.error('Update ticket status error:', error);
    return res.status(500).json({ message: 'Server error updating ticket status.' });
  }
});

/**
 * @swagger
 * /api/tickets/{id}/image:
 *   post:
 *     summary: Upload an image for a ticket (Technician)
 *     tags: [Tickets]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded
 *       400:
 *         description: No file uploaded
 *       404:
 *         description: Ticket not found
 *       500:
 *         description: Server error
 */
router.post('/:id/image', auth, roleCheck('admin', 'technician'), upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file uploaded.' });
  }

  try {
    const [ticketRows] = await pool.query(
      'SELECT ticket_id FROM maintenance_tickets WHERE ticket_id = ?',
      [req.params.id]
    );

    if (ticketRows.length === 0) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }

    const imageUrl = `/uploads/tickets/${req.file.filename}`;

    await pool.query(
      'UPDATE maintenance_tickets SET repair_image = ? WHERE ticket_id = ?',
      [imageUrl, req.params.id]
    );

    return res.status(200).json({
      message: 'Image uploaded successfully.',
      image_url: imageUrl,
    });
  } catch (error) {
    console.error('Upload ticket image error:', error);
    return res.status(500).json({ message: 'Server error uploading image.' });
  }
});

module.exports = router;
