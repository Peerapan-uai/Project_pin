const pool = require('../config/db');

// รันทุก 1 นาที — ตรวจ booking ที่จองมาเกิน 30 นาทีแล้วยังไม่ได้เริ่มชาร์จ
async function expireStaleBookings() {
  try {
    // หา booking ที่ confirmed + เลย start_time ไปเกิน 30 นาทีแล้ว
    const [stale] = await pool.query(
      `SELECT booking_id, charger_id FROM bookings
       WHERE status = 'confirmed'
       AND start_time < DATE_SUB(NOW(), INTERVAL 30 MINUTE)`
    );

    if (stale.length === 0) return;

    const ids = stale.map(b => b.booking_id);
    const chargerIds = stale.map(b => b.charger_id);

    await pool.query(
      `UPDATE bookings SET status = 'expired' WHERE booking_id IN (?)`,
      [ids]
    );

    // คืนตู้ชาร์จกลับว่าง (เฉพาะที่ยัง reserved อยู่)
    await pool.query(
      `UPDATE chargers SET status = 'available'
       WHERE charger_id IN (?) AND status = 'reserved'`,
      [chargerIds]
    );

    console.log(`[expireBookings] expired ${ids.length} booking(s):`, ids);
  } catch (err) {
    console.error('[expireBookings] error:', err.message);
  }
}

function startExpireJob() {
  // รอ 3 วินาทีให้ DB connection พร้อมก่อน แล้วค่อยรันครั้งแรก
  setTimeout(() => {
    expireStaleBookings();
    setInterval(expireStaleBookings, 60 * 1000);
  }, 3000);
  console.log('[expireBookings] job started');
}

module.exports = { startExpireJob };
