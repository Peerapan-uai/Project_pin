const pool = require('../config/db');

function getPeriodForHour(bangkokHour) {
  return (bangkokHour >= 22 || bangkokHour < 9) ? 'off_peak' : 'on_peak';
}

async function getCurrentPrice(chargerId) {
  const bangkokHour = new Date(Date.now() + 7 * 3600 * 1000).getUTCHours();
  const period = getPeriodForHour(bangkokHour);
  const [rows] = await pool.query(
    'SELECT price_per_kwh FROM tariffs WHERE charger_id = ? AND period = ?',
    [chargerId, period]
  );
  return rows[0]?.price_per_kwh ?? null;
}

module.exports = { getCurrentPrice, getPeriodForHour };


