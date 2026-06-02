const bcrypt = require('bcryptjs')
const cron = require('node-cron')
const pool = require('../config/db')

const DEMO_EMAIL = 'demo@ev-charger.com'
const DEMO_PASSWORD = 'demo1234'
const INACTIVE_THRESHOLD_MS = 10 * 60 * 1000 // 10 นาที

let lastActiveTime = null // ครั้งล่าสุดที่มี active session

async function hasActiveSession() {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS cnt FROM charging_sessions WHERE status = 'charging'`
  )
  return rows[0].cnt > 0
}

async function resetAndSeed() {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    // ลบ user-generated data (FK order: children ก่อน parents)
    await conn.query(`DELETE FROM wallet_transactions`)
    await conn.query(`DELETE FROM point_transactions`)
    await conn.query(`DELETE FROM point_balances`)
    await conn.query(`DELETE FROM payment_refunds`)
    await conn.query(`DELETE FROM refund_requests`)
    await conn.query(`DELETE FROM messages`)
    await conn.query(`DELETE FROM notifications`)
    await conn.query(`DELETE FROM booking_skip_dates`)
    await conn.query(`DELETE FROM charging_sessions`)
    await conn.query(`DELETE FROM payments`)
    await conn.query(`DELETE FROM bookings`)
    await conn.query(`DELETE FROM recurring_schedules`)
    await conn.query(`DELETE FROM user_favorites`)
    await conn.query(`DELETE FROM vehicles`)
    await conn.query(`DELETE FROM reviews`)
    await conn.query(`DELETE FROM users WHERE role = 'user'`)

    // Seed demo user
    const hash = await bcrypt.hash(DEMO_PASSWORD, 10)
    const [result] = await conn.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, phone, role, wallet_balance)
       VALUES (?, ?, ?, ?, ?, 'user', 500.00)`,
      ['ผู้ทดลอง', 'ระบบ', DEMO_EMAIL, hash, '0800000000']
    )
    const userId = result.insertId

    // Seed demo vehicle
    await conn.query(
      `INSERT INTO vehicles (user_id, brand, model, license_plate, connector_type, battery_capacity_kwh, battery_current_kwh)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, 'Tesla', 'Model 3', 'กข-1234', 'CCS', 75.0, 60.0]
    )

    await conn.commit()
    console.log('[DemoReset] Reset และ seed demo user เรียบร้อย')
  } catch (err) {
    await conn.rollback()
    console.error('[DemoReset] Error:', err.message)
  } finally {
    conn.release()
  }
}

async function seedIfEmpty() {
  const [rows] = await pool.query(`SELECT user_id FROM users WHERE email = ?`, [DEMO_EMAIL])
  if (rows.length === 0) {
    console.log('[DemoReset] ไม่มี demo user — seed ครั้งแรก')
    await resetAndSeed()
  }
}

function startDemoResetJob() {
  seedIfEmpty().catch((err) => console.error('[DemoReset] Initial seed error:', err.message))
  // เช็คทุก 1 นาที
  cron.schedule('* * * * *', async () => {
    try {
      const active = await hasActiveSession()

      if (active) {
        lastActiveTime = Date.now()
        return
      }

      // ไม่มี active session — เช็คว่าผ่านไป 10 นาทีแล้วหรือยัง
      if (lastActiveTime === null) {
        lastActiveTime = Date.now()
        return
      }

      const elapsed = Date.now() - lastActiveTime
      if (elapsed >= INACTIVE_THRESHOLD_MS) {
        console.log('[DemoReset] ไม่มี active session นาน 10 นาที — เริ่ม reset')
        await resetAndSeed()
        lastActiveTime = Date.now() // reset timer
      }
    } catch (err) {
      console.error('[DemoReset] Cron error:', err.message)
    }
  })

  console.log('[DemoReset] Demo reset job started')
}

module.exports = { startDemoResetJob }
