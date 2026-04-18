const express = require('express')
const router  = express.Router()
const pool    = require('../../config/db')
const auth    = require('../../middleware/auth')
const roleCheck = require('../../middleware/roleCheck')

// ─── GET trash lists ───────────────────────────────────────────────────────────

// GET /api/admin/trash/users — ดึง users ที่ถูก soft-delete
router.get('/users', auth, roleCheck('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT user_id, first_name, last_name, email, role, deleted_at
       FROM users
       WHERE deleted_at IS NOT NULL
       ORDER BY deleted_at DESC`
    )
    return res.json({ items: rows })
  } catch (err) {
    console.error('Trash users error:', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

// GET /api/admin/trash/stations — ดึง stations ที่ถูก soft-delete
router.get('/stations', auth, roleCheck('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT station_id, name, address, status, deleted_at
       FROM stations
       WHERE deleted_at IS NOT NULL
       ORDER BY deleted_at DESC`
    )
    return res.json({ items: rows })
  } catch (err) {
    console.error('Trash stations error:', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

// GET /api/admin/trash/chargers — ดึง chargers ที่ถูก soft-delete
router.get('/chargers', auth, roleCheck('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.charger_id, c.charger_name, c.connector_type, c.power_kw, c.status, c.deleted_at,
              s.name AS station_name
       FROM chargers c
       JOIN stations s ON c.station_id = s.station_id
       WHERE c.deleted_at IS NOT NULL
       ORDER BY c.deleted_at DESC`
    )
    return res.json({ items: rows })
  } catch (err) {
    console.error('Trash chargers error:', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

// ─── RESTORE ──────────────────────────────────────────────────────────────────

// PATCH /api/admin/trash/users/:id/restore — กู้คืน user
router.patch('/users/:id/restore', auth, roleCheck('admin'), async (req, res) => {
  try {
    const [result] = await pool.query(
      'UPDATE users SET deleted_at = NULL WHERE user_id = ? AND deleted_at IS NOT NULL',
      [req.params.id]
    )
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'ไม่พบ user ใน trash' })
    return res.json({ message: 'กู้คืน user สำเร็จ' })
  } catch (err) {
    console.error('Restore user error:', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

// PATCH /api/admin/trash/stations/:id/restore — กู้คืน station
router.patch('/stations/:id/restore', auth, roleCheck('admin'), async (req, res) => {
  try {
    const [result] = await pool.query(
      'UPDATE stations SET deleted_at = NULL WHERE station_id = ? AND deleted_at IS NOT NULL',
      [req.params.id]
    )
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'ไม่พบ station ใน trash' })
    return res.json({ message: 'กู้คืน station สำเร็จ' })
  } catch (err) {
    console.error('Restore station error:', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

// PATCH /api/admin/trash/chargers/:id/restore — กู้คืน charger
router.patch('/chargers/:id/restore', auth, roleCheck('admin'), async (req, res) => {
  try {
    const [result] = await pool.query(
      'UPDATE chargers SET deleted_at = NULL WHERE charger_id = ? AND deleted_at IS NOT NULL',
      [req.params.id]
    )
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'ไม่พบ charger ใน trash' })
    return res.json({ message: 'กู้คืน charger สำเร็จ' })
  } catch (err) {
    console.error('Restore charger error:', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

// ─── PERMANENT DELETE ─────────────────────────────────────────────────────────

// DELETE /api/admin/trash/users/:id — ลบถาวร (ต้อง soft-delete ก่อนแล้วเท่านั้น)
router.delete('/users/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM users WHERE user_id = ? AND deleted_at IS NOT NULL',
      [req.params.id]
    )
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'ไม่พบ user ใน trash' })
    return res.json({ message: 'ลบถาวรสำเร็จ' })
  } catch (err) {
    console.error('Permanent delete user error:', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

// DELETE /api/admin/trash/stations/:id — ลบถาวร
router.delete('/stations/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM stations WHERE station_id = ? AND deleted_at IS NOT NULL',
      [req.params.id]
    )
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'ไม่พบ station ใน trash' })
    return res.json({ message: 'ลบถาวรสำเร็จ' })
  } catch (err) {
    console.error('Permanent delete station error:', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

// DELETE /api/admin/trash/chargers/:id — ลบถาวร
router.delete('/chargers/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM chargers WHERE charger_id = ? AND deleted_at IS NOT NULL',
      [req.params.id]
    )
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'ไม่พบ charger ใน trash' })
    return res.json({ message: 'ลบถาวรสำเร็จ' })
  } catch (err) {
    console.error('Permanent delete charger error:', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
