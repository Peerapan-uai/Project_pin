const pool = require('../config/db');

function startTemperatureSimulator() {
  setInterval(async () => {
    try {
      // เฉพาะตู้ที่กำลังชาร์จอยู่
      const [chargers] = await pool.query(
        `SELECT charger_id, temperature_celsius FROM chargers WHERE status = 'charging'`
      );

      for (const ch of chargers) {
        const current = ch.temperature_celsius != null ? parseFloat(ch.temperature_celsius) : 30;
        const delta = Math.random() * 5 - 2; // -2 ถึง +3
        const next = Math.min(70, Math.max(25, parseFloat((current + delta).toFixed(1))));
        await pool.query(
          `UPDATE chargers SET temperature_celsius = ? WHERE charger_id = ?`,
          [next, ch.charger_id]
        );
      }
    } catch (err) {
      console.error('Temperature simulator error:', err.message);
    }
  }, 30000); // ทุก 30 วินาที
}

module.exports = { startTemperatureSimulator };
