# BE — spareParts.js (ไฟล์ใหม่)

> สร้างไฟล์ใหม่: `backend/routes/spareParts.js`
> แล้ว register ใน `server.js` หรือ `app.js`

---

## ต้องทำอะไรบ้าง

4 กลุ่ม endpoint:
1. Admin CRUD คลังอะไหล่ (spare_parts table)
2. Tech ขอเบิกอะไหล่ (part_requests table)
3. Admin อนุมัติ/ปฏิเสธการเบิก → stock ลดอัตโนมัติ
4. Tech/Admin ดูรายการเบิกของ ticket

---

## โครงสร้างไฟล์

```js
const express = require('express')
const router = express.Router()
const pool = require('../config/db')
const auth = require('../middleware/auth')
const roleCheck = require('../middleware/roleCheck')
```

---

## Endpoint 1 — GET /api/spare-parts (admin ดูคลังทั้งหมด)

```js
router.get('/', auth, roleCheck('admin'), async (req, res) => {
  const [rows] = await pool.query(
    `SELECT * FROM spare_parts ORDER BY category, name`
  )
  res.json({ parts: rows })
})
```

**⚠️ เพิ่ม low stock warning:**
FE จะ highlight ถ้า `stock_qty <= min_stock`

---

## Endpoint 2 — POST /api/spare-parts (admin เพิ่มอะไหล่ใหม่)

```js
router.post('/', auth, roleCheck('admin'), async (req, res) => {
  const { name, category, unit, stock_qty, min_stock, cost_per_unit } = req.body
  const validCategories = ['electrical','mechanical','display','cable','connector','other']
  if (!name || !category || !validCategories.includes(category))
    return res.status(400).json({ message: 'name และ category required' })

  const [result] = await pool.query(
    `INSERT INTO spare_parts (name, category, unit, stock_qty, min_stock, cost_per_unit)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, category, unit || 'ชิ้น', stock_qty || 0, min_stock || 5, cost_per_unit || 0]
  )
  res.status(201).json({ message: 'เพิ่มอะไหล่สำเร็จ', part_id: result.insertId })
})
```

---

## Endpoint 3 — PUT /api/spare-parts/:id/stock (admin ปรับสต็อก)

```js
router.put('/:id/stock', auth, roleCheck('admin'), async (req, res) => {
  const { stock_qty } = req.body
  if (stock_qty == null || stock_qty < 0)
    return res.status(400).json({ message: 'stock_qty ต้องเป็นตัวเลข >= 0' })
  const [result] = await pool.query(
    `UPDATE spare_parts SET stock_qty = ? WHERE part_id = ?`,
    [stock_qty, req.params.id]
  )
  if (result.affectedRows === 0)
    return res.status(404).json({ message: 'ไม่พบอะไหล่' })
  res.json({ message: 'อัปเดต stock สำเร็จ' })
})
```

---

## Endpoint 4 — POST /api/spare-parts/request (tech ขอเบิก)

```js
router.post('/request', auth, roleCheck('technician'), async (req, res) => {
  const { ticket_id, part_id, qty_requested } = req.body
  if (!ticket_id || !part_id || !qty_requested || qty_requested < 1)
    return res.status(400).json({ message: 'ข้อมูลไม่ครบ' })

  // เช็คว่า ticket นี้ assigned ให้ช่างคนนี้จริง
  const [[ticket]] = await pool.query(
    `SELECT ticket_id FROM maintenance_tickets WHERE ticket_id = ? AND assigned_to = ?`,
    [ticket_id, req.user.user_id]
  )
  if (!ticket) return res.status(403).json({ message: 'ไม่ใช่งานของคุณ' })

  // เช็คว่า part มีอยู่จริง
  const [[part]] = await pool.query(
    `SELECT part_id, stock_qty FROM spare_parts WHERE part_id = ?`, [part_id]
  )
  if (!part) return res.status(404).json({ message: 'ไม่พบอะไหล่' })
  if (part.stock_qty < qty_requested)
    return res.status(400).json({ message: `สต็อกไม่พอ (มี ${part.stock_qty})` })

  const [result] = await pool.query(
    `INSERT INTO part_requests (ticket_id, tech_id, part_id, qty_requested)
     VALUES (?, ?, ?, ?)`,
    [ticket_id, req.user.user_id, part_id, qty_requested]
  )
  res.status(201).json({ message: 'ส่งคำขอเบิกแล้ว รอ admin อนุมัติ', request_id: result.insertId })
})
```

---

## Endpoint 5 — PATCH /api/spare-parts/request/:id/approve (admin อนุมัติ)

```js
router.patch('/request/:id/approve', auth, roleCheck('admin'), async (req, res) => {
  const { qty_approved } = req.body   // admin อาจอนุมัติน้อยกว่าที่ขอ

  const [[request]] = await pool.query(
    `SELECT * FROM part_requests WHERE request_id = ? AND status = 'pending'`,
    [req.params.id]
  )
  if (!request) return res.status(404).json({ message: 'ไม่พบคำขอหรือไม่ใช่ pending' })

  const approved = qty_approved ?? request.qty_requested

  // ลด stock
  await pool.query(
    `UPDATE spare_parts SET stock_qty = stock_qty - ? WHERE part_id = ?`,
    [approved, request.part_id]
  )

  await pool.query(
    `UPDATE part_requests SET status = 'approved', qty_approved = ?, approved_by = ?, approved_at = NOW()
     WHERE request_id = ?`,
    [approved, req.user.user_id, req.params.id]
  )
  res.json({ message: 'อนุมัติแล้ว' })
})
```

**⚠️ Gotcha:** ลด stock พร้อมกับ approve ไม่ใช่ตอน request — ถ้า reject stock ไม่ลด

---

## Endpoint 6 — PATCH /api/spare-parts/request/:id/reject (admin ปฏิเสธ)

```js
router.patch('/request/:id/reject', auth, roleCheck('admin'), async (req, res) => {
  const { notes } = req.body
  const [result] = await pool.query(
    `UPDATE part_requests SET status = 'rejected', notes = ?, approved_by = ?, approved_at = NOW()
     WHERE request_id = ? AND status = 'pending'`,
    [notes || null, req.user.user_id, req.params.id]
  )
  if (result.affectedRows === 0)
    return res.status(404).json({ message: 'ไม่พบหรือ approve ไปแล้ว' })
  res.json({ message: 'ปฏิเสธแล้ว' })
})
```

---

## Endpoint 7 — GET /api/spare-parts/requests/:ticketId (ดูการเบิกของ ticket)

```js
router.get('/requests/:ticketId', auth, async (req, res) => {
  const [rows] = await pool.query(`
    SELECT pr.*, sp.name AS part_name, sp.unit, sp.category,
           CONCAT(u.first_name, ' ', u.last_name) AS approved_by_name
    FROM part_requests pr
    JOIN spare_parts sp ON pr.part_id = sp.part_id
    LEFT JOIN users u ON pr.approved_by = u.user_id
    WHERE pr.ticket_id = ?
    ORDER BY pr.requested_at DESC
  `, [req.params.ticketId])
  res.json({ requests: rows })
})
```

---

## Register ใน server.js/app.js

```js
const sparePartsRouter = require('./routes/spareParts')
app.use('/api/spare-parts', sparePartsRouter)
```

---

## สรุป endpoints

| Method | Path | ใคร |
|--------|------|-----|
| GET | `/api/spare-parts` | admin |
| POST | `/api/spare-parts` | admin |
| PUT | `/api/spare-parts/:id/stock` | admin |
| POST | `/api/spare-parts/request` | tech |
| PATCH | `/api/spare-parts/request/:id/approve` | admin |
| PATCH | `/api/spare-parts/request/:id/reject` | admin |
| GET | `/api/spare-parts/requests/:ticketId` | admin/tech |