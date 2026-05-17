const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { calculatePriority } = require('../utils/priorityCalculator');
const { count } = require('console');


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

const proposalStorage = multer.diskStorage({
  destination: (req, file, cd) => {
    const dir = path.join(__dirname, '..', 'uploads', 'proposals')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cd(null, dir)
  },
  filename: (req, file, cd) => {
    const ext = path.extname(file.originalname)
    cd(null, `proposal-${req.params.id}-${Date.now()}${ext}`)
  },
})
const uploadProposal = multer({ storage: proposalStorage, limits: { fileSize: 5 * 1024 * 1024 }})

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
  const { issue_type, title, description, charger_id } = req.body;

  const validTypes = ['safety','no_charge','payment','physical_damage','display','other']
  if (!issue_type || !validTypes.includes(issue_type)) {
    return res.status(400).json({ message: 'issue_type is required' })
  }

  if (!title || !description) {
    return res.status(400).json({ message: 'Title and description are required.' });
  }

  try {
    const priority = await calculatePriority(issue_type, charger_id, pool)

    const [result] = await pool.query(
      `INSERT INTO maintenance_tickets (reported_by, issue_type, title, description, charger_id, priority, status)
       VALUES (?, ?, ?, ?, ?, ?, 'reported')`,
      [
        req.user.user_id,
        issue_type,
        title,
        description,
        charger_id || null,
        priority
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
               c.charger_name, c.connector_type, c.power_kw,
               s.name AS station_name,
               s.address AS station_address,
               s.latitude, s.longitude, s.floor
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
               c.charger_name, c.connector_type, c.power_kw,
               s.name AS station_name,
               s.address AS station_address,
               s.latitude, s.longitude, s.floor
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

/**
 * @swagger
 * /api/tickets/{id}/unassign:
 *   patch:
 *     summary: Unassign technician from ticket (Admin only)
 *     tags: [Tickets]
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
 *         description: Ticket unassigned
 *       404:
 *         description: Ticket not found
 *       500:
 *         description: Server error
 */
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
  const { status, repair_notes, test_notes } = req.body;
  const validStatuses = ['reported', 'assigned', 'in_progress', 'completed'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}.`,
    });
  }

  try {
    const [result] = await pool.query(
      `UPDATE maintenance_tickets SET status = ?, repair_notes = ?, test_notes = ? WHERE ticket_id = ?`,
      [status, repair_notes || null, test_notes || null, req.params.id]
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
router.post('/:id/image', auth, roleCheck('admin', 'technician', 'user'), upload.single('image'), async (req, res) => {
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

/**
 * @swagger
 * /api/tickets/{id}/test-image:
 *   post:
 *     summary: Upload test evidence image after repair (Admin + Technician)
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
 *         description: Test image uploaded
 *       400:
 *         description: No file uploaded
 *       404:
 *         description: Ticket not found
 *       500:
 *         description: Server error
 */
router.post('/:id/test-image', auth, roleCheck('admin', 'technician'), upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No image file uploaded.' })
  try {
    const [ticketRows] = await pool.query(
      'SELECT ticket_id FROM maintenance_tickets WHERE ticket_id = ?', [req.params.id]
    )
    if (ticketRows.length === 0) return res.status(404).json({ message: 'Ticket not found.' })
    const imageUrl = `/uploads/tickets/${req.file.filename}`
    await pool.query(
      'UPDATE maintenance_tickets SET test_evidence_image = ? WHERE ticket_id = ?',
      [imageUrl, req.params.id]
    )
    return res.status(200).json({ message: 'Test image uploaded.', image_url: imageUrl })
  } catch (error) {
    console.error('Upload test image error:', error)
    return res.status(500).json({ message: 'Server error uploading test image.' })
  }
})

/**
 * @swagger
 * /api/tickets/proposals/{id}/review:
 *   patch:
 *     summary: Admin reviews a repair proposal (Admin only)
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
 *                 enum: [approved_repair, approved_replace, rejected]
 *               admin_note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review saved
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Proposal not found or already reviewed
 *       500:
 *         description: Server error
 */
router.patch('/proposals/:id/review', auth, roleCheck('admin'), async (req, res) => {
  const { status, admin_note } = req.body
  const validStatus = ['approved_repair', 'approved_replace', 'rejected']

  if (!validStatus.includes(status))
    return res.status(400).json({ message: 'status ไม่ถูกต้อง' })

  const [result] = await pool.query(
    `UPDATE repair_proposals
     SET status = ?, admin_note = ?, reviewed_by = ?, reviewed_at = NOW()
     WHERE proposal_id = ? AND status = 'pending'`,
    [status, admin_note || null, req.user.user_id, req.params.id]
  )
  if (result.affectedRows === 0)
    return res.status(404).json({ message: 'ไม่พบข้อเสนอหรือ review ไปแล้ว' })

  res.json({ message: 'บันทึกผลการพิจารณาแล้ว' })

  try {
  const [[proposal]] = await pool.query(
    `SELECT tech_id, ticket_id FROM repair_proposals WHERE proposal_id = ?`,
    [req.params.id]
  )
  if (proposal) {
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'maintenance')`,
      [proposal.tech_id, 'ผลการพิจารณาข้อเสนอ', `ticket #${proposal.ticket_id}: ${status}`]
    )
  }
 } catch (_) {}

})



/**
 * @swagger
 * /api/tickets/{id}/checkin:
 *   patch:
 *     summary: Technician checks in to a ticket (sets status to in_progress)
 *     tags: [Tickets]
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
 *         description: Checked in successfully
 *       404:
 *         description: Ticket not found or not assigned to this technician
 *       500:
 *         description: Server error
 */
router.patch('/:id/checkin', auth, roleCheck('technician'), async (req, res) => {
  const [result] = await pool.query(
    `UPDATE maintenance_tickets SET check_in_at = NOW(), status = 'in_progress'
     WHERE ticket_id = ? AND assigned_to = ?`,
    [req.params.id, req.user.user_id]
  )
  if (result.affectedRows === 0)
    return res.status(404).json({ message: 'Ticket not found หรือ ไม่ใช่งานของคุณ' })
  res.json({ message: 'เช็คอินสำเร็จ' })
})


/**
 * @swagger
 * /api/tickets/{id}/proposal:
 *   post:
 *     summary: Technician submits a repair/replace proposal
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
 *             required: [recommendation, description]
 *             properties:
 *               recommendation:
 *                 type: string
 *                 enum: [repair, replace]
 *               repair_cost_estimate:
 *                 type: number
 *               replace_cost_estimate:
 *                 type: number
 *               estimated_time_hours:
 *                 type: number
 *               description:
 *                 type: string
 *               evidence_image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Proposal submitted
 *       400:
 *         description: Invalid recommendation or missing description
 *       403:
 *         description: Not your ticket
 *       500:
 *         description: Server error
 */
router.post('/:id/proposal', auth, roleCheck('technician'), uploadProposal.single('evidence_image'), async (req, res) => {
  const { recommendation, repair_cost_estimate, replace_cost_estimate, estimated_time_hours, description } = req.body

  if (!['repair', 'replace'].includes(recommendation))
    return res.status(400).json({ message: 'recommendation ต้องเป็น repair หรือ replace' })
  if (!description)
    return res.status(400).json({ message: 'description required' })

  const [[ticket]] = await pool.query(
    `select ticket_id from maintenance_tickets where ticket_id = ? and assigned_to = ?`, [req.params.id, req.user.user_id]
  )
  if (!ticket) return res.status(403).json({ message: 'ไม่ใช่งานของคุณ' })

  const imageUrl = req.file ? `/uploads/proposals/${req.file.filename}` : null
  const [result] = await pool.query(
    `INSERT INTO repair_proposals (ticket_id, tech_id, recommendation, repair_cost_estimate, replace_cost_estimate, estimated_time_hours, description, evidence_image)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.params.id, req.user.user_id, recommendation, repair_cost_estimate || null, replace_cost_estimate || null, estimated_time_hours || null, description, imageUrl]
  )

  res.status(201).json({ message: 'ส่งข้อเสนอแล้ว', proposal_id: result.insertId })
  try {
  await pool.query(
    `INSERT INTO notifications (user_id, title, message, type)
     SELECT user_id, 'ข้อเสนอจากช่าง',
       CONCAT('ticket #', ?, ' ช่างเสนอ: ', ?),
       'maintenance'
     FROM users WHERE role = 'admin'`,
    [req.params.id, recommendation === 'repair' ? 'ซ่อม' : 'เปลี่ยนตู้ใหม่']
  )
 } catch (_) {}


})


/**
 * @swagger
 * /api/tickets/{id}/proposals:
 *   get:
 *     summary: Get all repair proposals for a ticket (Admin + Technician)
 *     tags: [Tickets]
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
 *         description: List of proposals with tech name and reviewer name
 *       500:
 *         description: Server error
 */
router.get('/:id/proposals', auth, roleCheck('admin', 'technician'), async (req, res) => {
  const [rows] = await pool.query(`
    SELECT p.*,
           CONCAT(u.first_name, ' ', u.last_name) AS tech_name,
           CONCAT(r.first_name, ' ', r.last_name) AS reviewed_by_name
    FROM repair_proposals p
    JOIN users u ON p.tech_id = u.user_id
    LEFT JOIN users r ON p.reviewed_by = r.user_id
    WHERE p.ticket_id = ?
    ORDER BY p.created_at DESC
  `, [req.params.id])
  res.json({ proposals: rows })
})



/**
 * @swagger
 * /api/tickets/{id}/checkout:
 *   patch:
 *     summary: Technician checks out of a ticket (must check in first)
 *     tags: [Tickets]
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
 *         description: Checked out successfully
 *       400:
 *         description: Must check in first
 *       404:
 *         description: Ticket not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/checkout', auth, roleCheck('technician'), async (req, res) => {
  const [[ticket]] = await pool.query(
    `select check_in_at from maintenance_tickets where ticket_id = ?`,
    [req.params.id]
  )
  if (!ticket?.check_in_at)
    return res.status(400).json({ message: 'ต้องเช็คอินก่อน' })
  const [result] = await pool.query(
    `update maintenance_tickets set check_out_at = now() where ticket_id = ? and assigned_to = ?`,
    [req.params.id, req.user.user_id]
  )
  if (result.affectedRows === 0)
    return res.status(404).json({ message: 'Ticket not found' })
  res.json({ message: 'เช็คเอาท์สำเร็จ' })
})

/**
 * @swagger
 * /api/tickets/{id}/priority:
 *   patch:
 *     summary: Admin overrides ticket priority (safety tickets cannot be downgraded)
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
 *             required: [priority]
 *             properties:
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *     responses:
 *       200:
 *         description: Priority updated
 *       400:
 *         description: Invalid priority
 *       403:
 *         description: Cannot downgrade safety ticket
 *       500:
 *         description: Server error
 */
router.patch('/:id/priority', auth, roleCheck('admin'), async (req, res) => {
  const { priority } = req.body
  const valid = ['low','medium','high','critical']
  if (!valid.includes(priority))
    return res.status(400).json({ message: 'priority ไม่ถูกต้อง' })
  const [[ticket]] = await pool.query(
    `SELECT issue_type FROM maintenance_tickets WHERE ticket_id = ?`,
    [req.params.id]
  )
  if (ticket?.issue_type === 'safety' && priority !== 'critical')
    return res.status(403).json({ message: 'Safety ticket ลด priority ไม่ได้' })
  await pool.query(
    `UPDATE maintenance_tickets SET priority = ? WHERE ticket_id = ?`,
    [priority, req.params.id]
  )
  res.json({ message: 'Priority updated' })
})

/**
 * @swagger
 * /api/tickets/{id}/repair-history:
 *   get:
 *     summary: Get last 3 completed repairs for the same charger (Admin + Technician)
 *     tags: [Tickets]
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
 *         description: Repair history (up to 3 records)
 *       404:
 *         description: Ticket not found
 *       500:
 *         description: Server error
 */
router.get('/:id/repair-history', auth, roleCheck('admin', 'technician'), async (req, res) => {
  try {
    const [[ticket]] = await pool.query(
      `SELECT charger_id FROM maintenance_tickets WHERE ticket_id = ?`,
      [req.params.id]
    )
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' })

    const [rows] = await pool.query(
      `SELECT t.ticket_id, t.title, t.issue_type, t.priority,
              t.completed_at, t.repair_notes,
              CONCAT(u.first_name, ' ', u.last_name) AS tech_name
       FROM maintenance_tickets t
       LEFT JOIN users u ON t.assigned_to = u.user_id
       WHERE t.charger_id = ? AND t.status = 'completed' AND t.ticket_id != ?
       ORDER BY t.completed_at DESC
       LIMIT 3`,
      [ticket.charger_id, req.params.id]
    )
    res.json({ history: rows })
  } catch (error) {
    console.error('Repair history error:', error)
    res.status(500).json({ message: 'Server error.' })
  }
})

module.exports = router;
