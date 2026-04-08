const pool = require('../config/db');

// รันทุก 1 นาที — ตรวจ payment ที่ pending นานเกิน 15 นาที → set failed
async function expireStalePayments() {
  try {
    // ใช้ booking_time ของ session เป็น reference เวลา
    // เพราะ payments table ไม่มี created_at — ดู session start_time แทน
    const [stale] = await pool.query(
      `SELECT p.payment_id FROM payments p
       JOIN charging_sessions cs ON p.session_id = cs.session_id
       WHERE p.status = 'pending'
       AND cs.end_time < DATE_SUB(NOW(), INTERVAL 15 MINUTE)`
    );

    if (stale.length === 0) return;

    const ids = stale.map(p => p.payment_id);

    await pool.query(
      `UPDATE payments SET status = 'failed' WHERE payment_id IN (?)`,
      [ids]
    );

    console.log(`[expirePayments] expired ${ids.length} payment(s):`, ids);
  } catch (err) {
    console.error('[expirePayments] error:', err.message);
  }
}

function startExpirePaymentsJob() {
  setTimeout(() => {
    expireStalePayments();
    setInterval(expireStalePayments, 60 * 1000);
  }, 3000);
  console.log('[expirePayments] job started');
}

module.exports = { startExpirePaymentsJob };
