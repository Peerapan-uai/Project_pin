# BE — Repair vs Replace Proposal (ข้อ 1)

> ช่างยื่นข้อเสนอให้แอดมินประเมินว่าควรซ่อมหรือซื้อตู้ใหม่ พร้อมแนบหลักฐาน

---

## Schema — table ใหม่ `repair_proposals`

เพิ่มใน `backend/schema.sql` และรัน ALTER หรือ DROP/CREATE ใหม่:

```sql
CREATE TABLE `repair_proposals` (
  `proposal_id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `ticket_id` int UNSIGNED NOT NULL,
  `tech_id` int UNSIGNED NOT NULL,
  `recommendation` enum('repair','replace') NOT NULL,
  `estimated_cost` decimal(10,2) DEFAULT NULL,
  `estimated_time_hours` decimal(4,1) DEFAULT NULL,
  `description` text NOT NULL,
  `evidence_image` varchar(500) DEFAULT NULL,
  `status` enum('pending','approved_repair','approved_replace','rejected') NOT NULL DEFAULT 'pending',
  `reviewed_by` int UNSIGNED DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `admin_note` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`proposal_id`),
  KEY `fk_prop_ticket` (`ticket_id`),
  KEY `fk_prop_tech` (`tech_id`),
  KEY `fk_prop_reviewer` (`reviewed_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE `repair_proposals`
  ADD CONSTRAINT `fk_prop_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `maintenance_tickets` (`ticket_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_prop_tech` FOREIGN KEY (`tech_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_prop_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;
```

---

## ไฟล์ที่แก้ — `backend/routes/tickets.js`

เพิ่ม multer upload สำหรับ proposal image (ใช้ storage เดิมได้เลย ชื่อไฟล์เปลี่ยนเป็น `proposal-{id}-...`):

```js
const proposalStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'proposals')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `proposal-${req.params.id}-${Date.now()}${ext}`)
  },
})
const uploadProposal = multer({ storage: proposalStorage, limits: { fileSize: 5 * 1024 * 1024 } })
```

---

## Endpoint 1 — POST /api/tickets/:id/proposal (tech ยื่นข้อเสนอ)

```js
router.post('/:id/proposal', auth, roleCheck('technician'), uploadProposal.single('evidence_image'), async (req, res) => {
  const { recommendation, estimated_cost, estimated_time_hours, description } = req.body
  const validRec = ['repair', 'replace']

  if (!recommendation || !validRec.includes(recommendation))
    return res.status(400).json({ message: 'recommendation ต้องเป็น repair หรือ replace' })
  if (!description)
    return res.status(400).json({ message: 'description required' })

  // เช็คว่า ticket นี้ assigned ให้ช่างคนนี้
  const [[ticket]] = await pool.query(
    `SELECT ticket_id FROM maintenance_tickets WHERE ticket_id = ? AND assigned_to = ?`,
    [req.params.id, req.user.user_id]
  )
  if (!ticket) return res.status(403).json({ message: 'ไม่ใช่งานของคุณ' })

  const imageUrl = req.file ? `/uploads/proposals/${req.file.filename}` : null

  const [result] = await pool.query(
    `INSERT INTO repair_proposals
       (ticket_id, tech_id, recommendation, estimated_cost, estimated_time_hours, description, evidence_image)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [req.params.id, req.user.user_id, recommendation,
     estimated_cost || null, estimated_time_hours || null, description, imageUrl]
  )

  // แจ้ง admin ทุกคน
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type)
       SELECT user_id, 'ข้อเสนอจากช่าง',
         CONCAT('ช่างส่งข้อเสนอ [', ?, '] สำหรับ ticket #', ?),
         'maintenance'
       FROM users WHERE role = 'admin'`,
      [recommendation === 'repair' ? 'ซ่อม' : 'เปลี่ยนตู้ใหม่', req.params.id]
    )
  } catch (_) {}

  res.status(201).json({ message: 'ส่งข้อเสนอแล้ว รอ admin ประเมิน', proposal_id: result.insertId })
})
```

---

## Endpoint 2 — GET /api/tickets/:id/proposals (ดูข้อเสนอทั้งหมดของ ticket)

```js
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
```

---

## Endpoint 3 — PATCH /api/proposals/:id/review (admin อนุมัติ/ปฏิเสธ)

เพิ่ม router แยก หรือใช้ tickets router ก็ได้ — แนะนำเพิ่มใน tickets.js และ mount ใน server.js เป็น `/api/proposals`:

```js
// ถ้าเพิ่มใน tickets.js จะ path เป็น /api/tickets/proposals/:id/review
// แนะนำสร้าง router.patch('/proposals/:id/review') ใน tickets.js แล้ว export ทั้งหมด

router.patch('/proposals/:id/review', auth, roleCheck('admin'), async (req, res) => {
  const { status, admin_note } = req.body
  const validStatus = ['approved_repair', 'approved_replace', 'rejected']

  if (!status || !validStatus.includes(status))
    return res.status(400).json({ message: `status ต้องเป็น: ${validStatus.join(', ')}` })

  const [result] = await pool.query(
    `UPDATE repair_proposals
     SET status = ?, admin_note = ?, reviewed_by = ?, reviewed_at = NOW()
     WHERE proposal_id = ? AND status = 'pending'`,
    [status, admin_note || null, req.user.user_id, req.params.id]
  )
  if (result.affectedRows === 0)
    return res.status(404).json({ message: 'ไม่พบข้อเสนอหรือ review ไปแล้ว' })

  // แจ้งช่างว่า admin ตัดสินใจแล้ว
  try {
    const [[proposal]] = await pool.query(
      `SELECT p.tech_id, p.ticket_id FROM repair_proposals p WHERE p.proposal_id = ?`,
      [req.params.id]
    )
    if (proposal) {
      const label = status === 'rejected' ? 'ปฏิเสธข้อเสนอ' : 'อนุมัติข้อเสนอแล้ว'
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'maintenance')`,
        [proposal.tech_id, label, `ticket #${proposal.ticket_id}: ${status}`]
      )
    }
  } catch (_) {}

  res.json({ message: 'บันทึกผลการพิจารณาแล้ว' })
})
```

---

## สรุป endpoints

| Method | Path | ใคร |
|--------|------|-----|
| POST | `/api/tickets/:id/proposal` | tech — ยื่นข้อเสนอพร้อมรูป |
| GET | `/api/tickets/:id/proposals` | admin/tech — ดูข้อเสนอของ ticket |
| PATCH | `/api/tickets/proposals/:id/review` | admin — อนุมัติ/ปฏิเสธ |

---

## สิ่งที่ต้องทำ FE (บันทึกไว้ ไม่ใช่งานไฟล์นี้)

- **UpdateTicketPage** — เพิ่ม form: dropdown (ซ่อม/เปลี่ยน), ราคาประเมิน, เวลา (ชม.), คำอธิบาย, upload รูป evidence
- **TicketManagePage** — เพิ่ม proposal panel ใน TicketDetailPanel: แสดงข้อเสนอ + ปุ่มอนุมัติ/ปฏิเสธ + input admin_note