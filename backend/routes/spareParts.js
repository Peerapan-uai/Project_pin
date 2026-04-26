const express = require('express')
const router = express.Router()
const pool = require('../config/db')
const auth = require('../middleware/auth')
const roleCheck = require('../middleware/roleCheck')

router.get('/', auth, roleCheck('admin', 'technician'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM spare_parts ORDER BY category, name`
    )
    res.json({ parts: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
})

router.post('/', auth, roleCheck('admin'), async (req, res) => {
    try {
        const { name, category, unit, stock_qty, min_stock, cost_per_unit } = req.body
        const validCategories = ['electrical','mechanical','display','cable','connector','other']
        if (!name || !category || !validCategories.includes(category))
            return res.status(400).json({ message: 'name และ category required' })

        const [result] = await pool.query(
            `insert into spare_parts (name, category, unit, stock_qty, min_stock, cost_per_unit)
            values (?,?,?,?,?,?)`,
            [name, category, unit || 'ชิ้น', stock_qty || 0, min_stock || 5, cost_per_unit || 0]
        )
        res.status(201).json({ message: 'เพิ่มอะไหล่สำเร็จ', part_id: result.insertId })
    } catch (err) {
      console.error(err)
      res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
    }
})

router.put('/:id/stock', auth, roleCheck('admin'), async (req, res) => {
  try {
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
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
})









// Endpoint 4 — ดูรายการเบิกทั้งหมดของ ticket (ต้องอยู่ก่อน POST /request เพราะ Express match จากบนลงล่าง)
router.get('/requests/:ticketId', auth, async (req, res) => {
  try {
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
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
})

// Endpoint 5 — tech ขอเบิกอะไหล่
router.post('/request', auth, roleCheck('technician'), async (req, res) => {
  try {
    const { ticket_id, part_id, qty_requested } = req.body
    if (!ticket_id || !part_id || !qty_requested || qty_requested < 1)
      return res.status(400).json({ message: 'ข้อมูลไม่ครบ' })

    const [[ticket]] = await pool.query(
      `SELECT ticket_id FROM maintenance_tickets WHERE ticket_id = ? AND assigned_to = ?`,
      [ticket_id, req.user.user_id]
    )
    if (!ticket) return res.status(403).json({ message: 'ไม่ใช่งานของคุณ' })

    const [[part]] = await pool.query(
      `SELECT part_id, stock_qty FROM spare_parts WHERE part_id = ?`,
      [part_id]
    )
    if (!part) return res.status(404).json({ message: 'ไม่พบอะไหล่' })
    if (part.stock_qty < qty_requested)
      return res.status(400).json({ message: `สต็อกไม่พอ (มี ${part.stock_qty})` })

    const [result] = await pool.query(
      `INSERT INTO part_requests (ticket_id, tech_id, part_id, qty_requested) VALUES (?, ?, ?, ?)`,
      [ticket_id, req.user.user_id, part_id, qty_requested]
    )
    res.status(201).json({ message: 'ส่งคำขอเบิกแล้ว รอ admin อนุมัติ', request_id: result.insertId })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
})

// Endpoint 5 — admin อนุมัติการเบิก → ลด stock ทันที
router.patch('/request/:id/approve', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { qty_approved } = req.body

    const [[request]] = await pool.query(
      `SELECT * FROM part_requests WHERE request_id = ? AND status = 'pending'`,
      [req.params.id]
    )
    if (!request) return res.status(404).json({ message: 'ไม่พบคำขอหรือไม่ใช่ pending' })

    const approved = qty_approved ?? request.qty_requested

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
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
})

// Endpoint 6 — admin ปฏิเสธการเบิก → stock ไม่เปลี่ยน
router.patch('/request/:id/reject', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { notes } = req.body
    const [result] = await pool.query(
      `UPDATE part_requests SET status = 'rejected', notes = ?, approved_by = ?, approved_at = NOW()
       WHERE request_id = ? AND status = 'pending'`,
      [notes || null, req.user.user_id, req.params.id]
    )
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'ไม่พบหรือ approve ไปแล้ว' })

    res.json({ message: 'ปฏิเสธแล้ว' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
})

module.exports = router