const pool = require('../config/db');

/**
 * หักค่าธรรมเนียมจาก wallet → card → debt (B2 model)
 * @returns 'wallet' | 'card' | 'debt' | 'error'
 */
async function chargeFeeOrAddDebt(userId, amount, ref) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(
      'SELECT wallet_balance, omise_customer_id FROM users WHERE user_id = ? FOR UPDATE',
      [userId]
    );
    if (!rows[0]) { await conn.rollback(); return 'error'; }

    const balance = parseFloat(rows[0].wallet_balance);

    if (balance >= amount) {
      await conn.query('UPDATE users SET wallet_balance = wallet_balance - ? WHERE user_id = ?', [amount, userId]);
      await conn.query(
        "INSERT INTO wallet_transactions (user_id, amount, type, ref, reason) VALUES (?, ?, 'deduct', ?, 'ค่าธรรมเนียม')",
        [userId, amount, ref]
      );
      await conn.commit();
      return 'wallet';
    }

    if (rows[0].omise_customer_id) {
      try {
        const basicAuth = Buffer.from(`${process.env.OMISE_SECRET_KEY}:`).toString('base64');
        const chargeRes = await fetch('https://api.omise.co/charges', {
          method: 'POST',
          headers: { 'Authorization': `Basic ${basicAuth}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: Math.round(amount * 100),
            currency: 'thb',
            customer: rows[0].omise_customer_id,
            metadata: { ref, type: 'fee' },
          }),
        });
        const charge = await chargeRes.json();
        if (charge.status === 'successful') {
          await conn.commit();
          return 'card';
        }
      } catch (_) {}
    }

    await conn.query('UPDATE users SET outstanding_debt = outstanding_debt + ? WHERE user_id = ?', [amount, userId]);
    await conn.commit();
    return 'debt';
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

module.exports = { chargeFeeOrAddDebt };
