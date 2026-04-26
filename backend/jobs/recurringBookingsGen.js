const pool = require('../config/db');

const DAY_MAP = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0 };

async function generateRecurringBookings() {
  try {
    const [schedules] = await pool.query(
      `SELECT * FROM recurring_schedules WHERE active = 1`
    );

    if (schedules.length === 0) return;

    const now = new Date();
    // คำนวณวันพรุ่งนี้ (ทำให้ generate ล่วงหน้า 1 วัน)
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    for (const schedule of schedules) {
      const days = schedule.days_of_week.split(',');
      const tomorrowDay = tomorrow.getDay(); // 0=sun, 1=mon, ...

      const matchingDay = days.find(d => DAY_MAP[d] === tomorrowDay);
      if (!matchingDay) continue;

      // เช็ค skip date
      const [skipRows] = await pool.query(
        'SELECT 1 FROM booking_skip_dates WHERE schedule_id = ? AND skip_date = ?',
        [schedule.schedule_id, tomorrowStr]
      );
      if (skipRows.length > 0) continue;

      // เช็คว่า booking นี้ generate แล้วหรือยัง
      const scheduledStart = `${tomorrowStr}T${schedule.start_time}`;
      const [existRows] = await pool.query(
        `SELECT 1 FROM bookings
         WHERE recurring_schedule_id = ? AND DATE(scheduled_start) = ?`,
        [schedule.schedule_id, tomorrowStr]
      );
      if (existRows.length > 0) continue;

      // เช็ค conflict กับ booking อื่นในตู้เดียวกัน
      const [conflictRows] = await pool.query(
        `SELECT 1 FROM bookings WHERE charger_id = ?
          AND status IN ('pending','confirmed','active')
          AND scheduled_start IS NOT NULL
          AND NOT (
            DATE_ADD(scheduled_start, INTERVAL duration_min MINUTE) <= ?
            OR scheduled_start >= DATE_ADD(?, INTERVAL ? MINUTE)
          )
         LIMIT 1`,
        [schedule.charger_id, scheduledStart, scheduledStart, schedule.duration_min]
      );
      if (conflictRows.length > 0) {
        console.log(`[recurringBookingsGen] conflict: schedule ${schedule.schedule_id} on ${tomorrowStr}`);
        continue;
      }

      await pool.query(
        `INSERT INTO bookings
           (user_id, charger_id, scheduled_start, duration_min, recurring_schedule_id, status)
         VALUES (?, ?, ?, ?, ?, 'confirmed')`,
        [schedule.user_id, schedule.charger_id, scheduledStart, schedule.duration_min, schedule.schedule_id]
      );

      console.log(`[recurringBookingsGen] generated booking: schedule ${schedule.schedule_id} -> ${tomorrowStr} ${schedule.start_time}`);
    }
  } catch (err) {
    console.error('[recurringBookingsGen] error:', err.message);
  }
}

function startRecurringBookingsGenJob() {
  // รันทุกวัน 01:00 น.
  const msToNextRun = () => {
    const now = new Date();
    const next = new Date();
    next.setHours(1, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next.getTime() - now.getTime();
  };

  const scheduleNext = () => {
    setTimeout(() => {
      generateRecurringBookings();
      setInterval(generateRecurringBookings, 24 * 60 * 60 * 1000);
    }, msToNextRun());
  };

  scheduleNext();
  console.log('[recurringBookingsGen] job started');
}

module.exports = { startRecurringBookingsGenJob };
