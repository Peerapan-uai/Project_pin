const cron = require('node-cron');
const pool = require('../config/db');
const { chargeFeeOrAddDebt } = require('../utils/chargeFeeOrAddDebt');

function startNoShowChecker() {
  // รันทุก 5 นาที
  cron.schedule('*/5 * * * *', async () => {
    try {
      // หา bookings ที่ confirmed มานาน > 15 นาที และยังไม่มี charging session
      const [rows] = await pool.query(`
        SELECT b.booking_id, b.user_id, b.charger_id, b.booking_time
        FROM bookings b
        LEFT JOIN charging_sessions s ON s.booking_id = b.booking_id
        WHERE b.status = 'confirmed'
          AND b.booking_time < DATE_SUB(NOW(), INTERVAL 15 MINUTE)
          AND s.session_id IS NULL
      `);

      for (const b of rows) {
        try {
          const method = await chargeFeeOrAddDebt(b.user_id, 20, `noshow_${b.booking_id}`);

          await pool.query(
            `UPDATE bookings SET status = 'expired', no_show_fee_charged = 20 WHERE booking_id = ?`,
            [b.booking_id]
          );
          await pool.query(
            `UPDATE chargers SET status = 'available' WHERE charger_id = ? AND status = 'reserved'`,
            [b.charger_id]
          );

          const methodMsg = method === 'debt' ? 'ยอดค้างชำระได้รับการบันทึก' : 'หักจากกระเป๋าเงินแล้ว';
          await pool.query(
            `INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'ไม่มาชาร์จตามเวลา', ?, 'booking')`,
            [b.user_id, `การจอง #${b.booking_id} ถูกยกเลิกเนื่องจากไม่มาชาร์จภายใน 15 นาที ค่าธรรมเนียม ฿20 ${methodMsg}`]
          );
          console.log(`[NoShow] booking ${b.booking_id} expired, fee ${method}`);
        } catch (err) {
          console.error(`[NoShow] booking ${b.booking_id} error:`, err.message);
        }
      }
    } catch (err) {
      console.error('[NoShow] checker error:', err.message);
    }
  });
  console.log('[NoShow] checker started (every 5 min)');
}

module.exports = { startNoShowChecker };
