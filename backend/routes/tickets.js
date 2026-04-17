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
// ตั้งชื่อไฟล์ให้อัตโนมัติ กันซ้ำ
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
    ///icket-{id}-{timestamp}-{random}.jpg ตัวอย่างชื่อไฟล์
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
 *             required: [title, description]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               charger_id:
 *                 type: integer
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *     responses:
 *       201:
 *         description: Ticket created
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post('/', auth, async (req, res) => {
  const { title, description, charger_id, priority } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: 'Title and description are required.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO maintenance_tickets (reported_by, title, description, charger_id, priority, status)
       VALUES (?, ?, ?, ?, ?, 'reported')`,
      [
        req.user.user_id,
        title,
        description,
        charger_id || null,
        priority || 'medium',
      ]
    );

    const ticketId = result.insertId;

    // auto-notify: แจ้งแอดมินทุกคนเมื่อมีแจ้งซ่อมใหม่
    try {
      const [admins] = await pool.query(
        `SELECT user_id FROM users WHERE role = 'admin'`
      );

      if (admins.length > 0) {
        const notifValues = admins.map(a => [
          a.user_id,
          'มีแจ้งซ่อมใหม่',
          `แจ้งซ่อม #${ticketId}: ${title}`,
          'maintenance',
        ]);
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type) VALUES ?`,
          [notifValues]
        );
      }
    } catch (notifErr) {
      console.warn('Notify admins failed (non-critical):', notifErr.message);
    }

    return res.status(201).json({
      message: 'Support ticket created successfully.',
      ticket_id: ticketId,
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
///lalla   GET	/api/tickets	Get all tickets
router.get('/', auth, async (req, res) => {
  try {
    let query;
    let params;

    if (req.user.role === 'admin' || req.user.role === 'technician') {
      query = `
        SELECT t.*,
               CONCAT(u.first_name, ' ', u.last_name) AS reporter_name,
               CONCAT(tech.first_name, ' ', tech.last_name) AS assigned_to_name,
               c.charger_name,
               s.name AS station_name,
               s.address AS station_address
        FROM maintenance_tickets t
        JOIN users u ON t.reported_by = u.user_id
        LEFT JOIN users tech ON t.assigned_to = tech.user_id
        LEFT JOIN chargers c ON t.charger_id = c.charger_id
        LEFT JOIN stations s ON c.station_id = s.station_id
        ORDER BY t.created_at DESC
      `;
      params = [];
    } else {
      query = `
        SELECT t.*,
               CONCAT(u.first_name, ' ', u.last_name) AS reporter_name,
               CONCAT(tech.first_name, ' ', tech.last_name) AS assigned_to_name,
               c.charger_name,
               s.name AS station_name,
               s.address AS station_address
        FROM maintenance_tickets t
        JOIN users u ON t.reported_by = u.user_id
        LEFT JOIN users tech ON t.assigned_to = tech.user_id
        LEFT JOIN chargers c ON t.charger_id = c.charger_id
        LEFT JOIN stations s ON c.station_id = s.station_id
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
///lalla   PATCH	/api/tickets/{id}/assign	Assign ticket to technician
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
      `UPDATE maintenance_tickets SET assigned_to = ?, status = 'assigned', assigned_at = NOW() WHERE ticket_id = ?`,
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

// PATCH /api/tickets/:id/unassign — ยกเลิกมอบหมายช่าง
router.patch('/:id/unassign', auth, roleCheck('admin'), async (req, res) => {
  try {
    const [result] = await pool.query(
      `UPDATE maintenance_tickets SET assigned_to = NULL, assigned_at = NULL, status = 'reported' WHERE ticket_id = ?`,
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }
    return res.status(200).json({ message: 'Ticket unassigned successfully.' });
  } catch (error) {
    console.error('Unassign ticket error:', error);
    return res.status(500).json({ message: 'Server error unassigning ticket.' });
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
 *                 enum: [reported, assigned, in_progress, completed]
 *               repair_notes:
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
///lalla. PATCH	/api/tickets/{id}/status	Update ticket status
router.patch('/:id/status', auth, roleCheck('admin', 'technician'), async (req, res) => {
  const { status, repair_notes } = req.body;
  const validStatuses = ['reported', 'assigned', 'in_progress', 'completed'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}.`,
    });
  }

  try {
    const [result] = await pool.query(
      `UPDATE maintenance_tickets SET status = ?, repair_notes = ? WHERE ticket_id = ?`,
      [status, repair_notes || null, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }

    // ถ้าช่างกด "รับงาน" → ตั้งสถานะเป็น BUSY
    if (status === 'in_progress') {
      try {
        await pool.query(
          `update tech_profiles set status = 'BUSY' where user_id = ?`, [req.user.user_id]
        );
      } catch (_) {}
    }

    // ถ้าช่างกด "เสร็จงาน" → เช็คว่ายังมีงานค้างอีกไหม
    if (status === 'completed') {
      try {
        const [remaining] = await pool.query(
          `select count(*) as cnt from maintenance_tickets
          where assigned_to = ? and status in ('assigned', 'in_progress')`,[req.user.user_id]
        );
        if (remaining[0].cnt === 0) {
          await pool.query(
            `update tech_profiles set status = 'AVAILABLE' where user_id = ?`,[req.user.user_id]
          );
        }
      } catch (_) {}
    }



    // แจ้ง admin ทุกคนเมื่อช่างซ่อมเสร็จ
    if (status === 'completed') {
      const [ticketRows] = await pool.query(
        `SELECT mt.title, mt.ticket_id, CONCAT(u.first_name, ' ', u.last_name) AS tech_name
         FROM maintenance_tickets mt
         LEFT JOIN users u ON mt.assigned_to = u.user_id
         WHERE mt.ticket_id = ?`, [req.params.id]
      );
      const ticket = ticketRows[0];
      if (ticket) {
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type)
           SELECT user_id,
             'ซ่อมเสร็จแล้ว',
             CONCAT(?, ' ซ่อมเสร็จโดย ', ?),
             'maintenance'
           FROM users WHERE role = 'admin'`,
          [ticket.title, ticket.tech_name || 'ช่าง']
        );
      }
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
///lalla  POST	/api/tickets/{id}/image	Upload repair image
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
    // req.file.filename ตั้งชื่อ ไฟล์ให้อัตโนมัติเป็น ticket-{id}-{timestamp}-{random}.jpg ป้องกันชื่อซ้ำ
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
