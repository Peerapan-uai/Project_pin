const pool = require('../config/db');
const { chargeFeeOrAddDebt } = require('../utils/chargeFeeOrAddDebt');

const IDLE_GRACE_MIN = 5;
const IDLE_FEE_PER_MIN = 5;
const IDLE_MAX_MIN = 60;

async function processIdleFeeSessions() {
  try {
    // หา sessions ที่ full_charge_time ตั้งแล้ว + ยังไม่ end + เกิน threshold
    const [sessions] = await pool.query(
      `SELECT s.session_id, s.user_id, s.charger_id, s.booking_id, s.full_charge_time
       FROM charging_sessions s
       WHERE s.full_charge_time IS NOT NULL
         AND s.end_time IS NULL
         AND s.status = 'charging'
         AND TIMESTAMPDIFF(MINUTE, s.full_charge_time, NOW()) > ?`,
      [IDLE_GRACE_MIN + IDLE_MAX_MIN]
    );

    for (const session of sessions) {
      try {
        const fullChargeTime = new Date(session.full_charge_time);
        const billableMins = Math.max(0, (Date.now() - fullChargeTime.getTime()) / 60000 - IDLE_GRACE_MIN);
        const idleFee = Math.round(billableMins * IDLE_FEE_PER_MIN * 100) / 100;

        const conn = await pool.getConnection();
        try {
          await conn.beginTransaction();
          await conn.query(
            `UPDATE charging_sessions
             SET idle_end_time = NOW(), idle_fee = ?, end_time = NOW(), status = 'completed'
             WHERE session_id = ?`,
            [idleFee, session.session_id]
          );
          await conn.query(
            `UPDATE chargers SET status = 'available' WHERE charger_id = ?`,
            [session.charger_id]
          );
          await conn.query(
            `UPDATE bookings SET status = 'completed' WHERE booking_id = ?`,
            [session.booking_id]
          );
          await conn.commit();
        } catch (txErr) {
          await conn.rollback();
          throw txErr;
        } finally {
          conn.release();
        }

        if (idleFee > 0) {
          await chargeFeeOrAddDebt(session.user_id, idleFee, `idle_auto_${session.session_id}`);
        }

        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'ถอดสายอัตโนมัติ', ?, 'charging')`,
          [session.user_id, `session ถูกปิดอัตโนมัติเพราะคุณไม่มาถอดสาย ค่า idle fee ฿${idleFee.toFixed(2)}`]
        );

        console.log(`[idleFeeAutoStop] force-unplugged session ${session.session_id}, idle_fee=${idleFee}`);
      } catch (sessionErr) {
        console.error(`[idleFeeAutoStop] error for session ${session.session_id}:`, sessionErr.message);
      }
    }
  } catch (err) {
    console.error('[idleFeeAutoStop] error:', err.message);
  }
}

function startIdleFeeAutoStopJob() {
  setTimeout(() => {
    processIdleFeeSessions();
    setInterval(processIdleFeeSessions, 60 * 1000); // ทุก 1 นาที
  }, 5000);
  console.log('[idleFeeAutoStop] job started');
}

module.exports = { startIdleFeeAutoStopJob };
