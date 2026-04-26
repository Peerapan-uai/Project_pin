const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

const VALID_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const VALID_DURATIONS = [15, 30, 45, 60, 90, 120];

// POST /api/recurring-bookings — สร้าง recurring schedule ใหม่
router.post('/', auth, async (req, res) => {
  const { charger_id, days_of_week, start_time, duration_min = 60, weeks_ahead = 4 } = req.body;

  if (!charger_id || !days_of_week?.length || !start_time) {
    return res.status(400).json({ message: 'charger_id, days_of_week, start_time จำเป็นต้องมี' });
  }
  if (!Array.isArray(days_of_week) || !days_of_week.every(d => VALID_DAYS.includes(d))) {
    return res.status(400).json({ message: 'days_of_week ต้องเป็น array ของ mon/tue/wed/thu/fri/sat/sun' });
  }
  if (!VALID_DURATIONS.includes(Number(duration_min))) {
    return res.status(400).json({ message: 'duration_min ต้องเป็น 15/30/45/60/90/120' });
  }

  try {
    const [chargerRows] = await pool.query('SELECT charger_id FROM chargers WHERE charger_id = ?', [charger_id]);
    if (chargerRows.length === 0) return res.status(404).json({ message: 'Charger not found.' });

    const [result] = await pool.query(
      `INSERT INTO recurring_schedules (user_id, charger_id, days_of_week, start_time, duration_min, weeks_ahead)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.user_id, charger_id, days_of_week.join(','), start_time, duration_min, weeks_ahead]
    );

    return res.status(201).json({ message: 'Recurring schedule created.', schedule_id: result.insertId });
  } catch (error) {
    console.error('Create recurring error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/recurring-bookings — list ของ user
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT rs.*, c.charger_name, c.connector_type, s.name AS station_name
       FROM recurring_schedules rs
       JOIN chargers c ON rs.charger_id = c.charger_id
       JOIN stations s ON c.station_id = s.station_id
       WHERE rs.user_id = ?
       ORDER BY rs.created_at DESC`,
      [req.user.user_id]
    );
    return res.json({ schedules: rows });
  } catch (error) {
    console.error('Get recurring error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// PATCH /api/recurring-bookings/:id — toggle active / แก้ไข
router.patch('/:id', auth, async (req, res) => {
  const { active, start_time, duration_min, weeks_ahead } = req.body;
  try {
    const [rows] = await pool.query(
      'SELECT schedule_id FROM recurring_schedules WHERE schedule_id = ? AND user_id = ?',
      [req.params.id, req.user.user_id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Schedule not found.' });

    const fields = [];
    const vals = [];
    if (active !== undefined) { fields.push('active = ?'); vals.push(active ? 1 : 0); }
    if (start_time) { fields.push('start_time = ?'); vals.push(start_time); }
    if (duration_min && VALID_DURATIONS.includes(Number(duration_min))) {
      fields.push('duration_min = ?'); vals.push(Number(duration_min));
    }
    if (weeks_ahead) { fields.push('weeks_ahead = ?'); vals.push(Number(weeks_ahead)); }

    if (fields.length === 0) return res.status(400).json({ message: 'ไม่มีฟิลด์ที่ต้องอัปเดต' });

    vals.push(req.params.id);
    await pool.query(`UPDATE recurring_schedules SET ${fields.join(', ')} WHERE schedule_id = ?`, vals);
    return res.json({ message: 'Updated.' });
  } catch (error) {
    console.error('Update recurring error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/recurring-bookings/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT schedule_id FROM recurring_schedules WHERE schedule_id = ? AND user_id = ?',
      [req.params.id, req.user.user_id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Schedule not found.' });

    await pool.query('DELETE FROM recurring_schedules WHERE schedule_id = ?', [req.params.id]);
    return res.json({ message: 'Deleted.' });
  } catch (error) {
    console.error('Delete recurring error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/recurring-bookings/:id/skip — skip วันใดวันหนึ่ง
router.post('/:id/skip', auth, async (req, res) => {
  const { date } = req.body; // 'YYYY-MM-DD'
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ message: 'date ต้องอยู่ในรูป YYYY-MM-DD' });
  }
  try {
    const [rows] = await pool.query(
      'SELECT schedule_id FROM recurring_schedules WHERE schedule_id = ? AND user_id = ?',
      [req.params.id, req.user.user_id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Schedule not found.' });

    await pool.query(
      'INSERT IGNORE INTO booking_skip_dates (schedule_id, skip_date) VALUES (?, ?)',
      [req.params.id, date]
    );
    return res.json({ message: 'Skipped.' });
  } catch (error) {
    console.error('Skip recurring error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
