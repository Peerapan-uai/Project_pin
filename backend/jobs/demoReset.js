const bcrypt = require('bcryptjs')
const cron = require('node-cron')
const pool = require('../config/db')

const DEMO_EMAIL = 'demo@ev-charger.com'
const DEMO_PASSWORD = 'demo1234'
const RESET_INTERVAL_MS = 3 * 60 * 60 * 1000 // 3 ชม.

// accounts ที่ห้ามลบ
const PROTECTED_EMAILS = [DEMO_EMAIL, 'nemuser@ev-charger.com', 'lalla@ev-charger.com']

const SEED_USERS = [
  {
    first_name: 'ผู้ทดลอง',
    last_name: 'ระบบ',
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    phone: '0800000000',
    wallet: 500.0,
  },
  {
    first_name: 'Nem',
    last_name: 'Test',
    email: 'nemuser@ev-charger.com',
    password: 'test1234',
    phone: '0811111111',
    wallet: 500.0,
  },
  {
    first_name: 'Lalla',
    last_name: 'Test',
    email: 'lalla@ev-charger.com',
    password: 'test1234',
    phone: '0822222222',
    wallet: 500.0,
  },
]

async function resetAndSeed() {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    // 1. หา user ที่จะลบ (ไม่ใช่ protected + ไม่ใช่ admin/tech)
    const placeholders = PROTECTED_EMAILS.map(() => '?').join(',')
    const [tempUsers] = await conn.query(
      `SELECT user_id FROM users WHERE email NOT IN (${placeholders}) AND role = 'user'`,
      PROTECTED_EMAILS
    )
    const tempUserIds = tempUsers.map((u) => u.user_id)

    if (tempUserIds.length > 0) {
      const idPlaceholders = tempUserIds.map(() => '?').join(',')

      // 2. reset charger status ที่ค้างจาก temp users
      await conn.query(
        `UPDATE chargers SET status = 'available'
         WHERE charger_id IN (
           SELECT charger_id FROM bookings
           WHERE user_id IN (${idPlaceholders})
           AND status IN ('confirmed', 'active')
         )`,
        tempUserIds
      )

      // 3. ลบ temp users — CASCADE ลบ bookings/sessions/payments/wallet ตาม
      await conn.query(`DELETE FROM users WHERE user_id IN (${idPlaceholders})`, tempUserIds)
    }

    // 4. reset demo user — ล้าง activity + คืน wallet 500
    const [demoRows] = await conn.query(`SELECT user_id FROM users WHERE email = ?`, [DEMO_EMAIL])
    if (demoRows.length > 0) {
      const demoId = demoRows[0].user_id

      // reset charger status จาก demo user ก่อนลบ bookings
      await conn.query(
        `UPDATE chargers SET status = 'available'
         WHERE charger_id IN (
           SELECT charger_id FROM bookings
           WHERE user_id = ? AND status IN ('confirmed', 'active')
         )`,
        [demoId]
      )

      await conn.query(`DELETE FROM charging_sessions WHERE user_id = ?`, [demoId])
      await conn.query(`DELETE FROM payments WHERE user_id = ?`, [demoId])
      await conn.query(`DELETE FROM bookings WHERE user_id = ?`, [demoId])
      await conn.query(`DELETE FROM wallet_transactions WHERE user_id = ?`, [demoId])
      await conn.query(`DELETE FROM point_transactions WHERE user_id = ?`, [demoId])
      await conn.query(`DELETE FROM point_balances WHERE user_id = ?`, [demoId])
      await conn.query(`DELETE FROM reviews WHERE user_id = ?`, [demoId])
      await conn.query(`DELETE FROM user_favorites WHERE user_id = ?`, [demoId])
      await conn.query(`DELETE FROM notifications WHERE user_id = ?`, [demoId])
      await conn.query(`DELETE FROM recurring_schedules WHERE user_id = ?`, [demoId])
      await conn.query(
        `UPDATE users SET wallet_balance = 500.00, outstanding_debt = 0.00, wallet_frozen = 0 WHERE user_id = ?`,
        [demoId]
      )
    }

    await conn.commit()
    console.log(`[DemoReset] Reset เรียบร้อย — ลบ ${tempUserIds.length} temp users`)
  } catch (err) {
    await conn.rollback()
    console.error('[DemoReset] Error:', err.message)
  } finally {
    conn.release()
  }
}

async function seedProtectedUsers() {
  for (const u of SEED_USERS) {
    const [rows] = await pool.query(`SELECT user_id FROM users WHERE email = ?`, [u.email])
    if (rows.length === 0) {
      const hash = await bcrypt.hash(u.password, 10)
      const [result] = await pool.query(
        `INSERT INTO users (first_name, last_name, email, password_hash, phone, role, wallet_balance)
         VALUES (?, ?, ?, ?, ?, 'user', ?)`,
        [u.first_name, u.last_name, u.email, hash, u.phone, u.wallet]
      )
      // seed vehicle ให้ demo user เท่านั้น
      if (u.email === DEMO_EMAIL) {
        await pool.query(
          `INSERT INTO vehicles (user_id, brand, model, license_plate, connector_type, battery_capacity_kwh, battery_current_kwh)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [result.insertId, 'Tesla', 'Model 3', 'กข-1234', 'CCS', 75.0, 60.0]
        )
      }
      console.log(`[DemoReset] Seeded user: ${u.email}`)
    }
  }
}

function startDemoResetJob() {
  seedProtectedUsers().catch((err) => console.error('[DemoReset] Initial seed error:', err.message))

  // reset ทุก 3 ชม.
  setInterval(async () => {
    console.log('[DemoReset] เริ่ม reset รอบ 3 ชม.')
    await resetAndSeed()
    await seedProtectedUsers()
  }, RESET_INTERVAL_MS)

  console.log('[DemoReset] Demo reset job started (ทุก 3 ชม.)')
}

module.exports = { startDemoResetJob }
