const pool = require('../config/db');

/**
 * คืนราคา kWh ตาม TOU ณ เวลาปัจจุบัน (Bangkok UTC+7)
 * Fallback: null (ให้ caller ใช้ chargers.price_per_kwh แทน)
 */
async function getCurrentPrice(chargerId) {
  const bangkokHour = new Date(Date.now() + 7 * 3600 * 1000).getUTCHours();
  const period = (bangkokHour >= 22 || bangkokHour < 9) ? 'off_peak' : 'on_peak';
  const [rows] = await pool.query(
    'SELECT price_per_kwh FROM tariffs WHERE charger_id = ? AND period = ?',
    [chargerId, period]
  );
  return rows[0]?.price_per_kwh ?? null;
}

module.exports = { getCurrentPrice };
