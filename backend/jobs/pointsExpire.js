const cron = require('node-cron');
const pool = require('../config/db');

function startPointsExpireJob() {
  // รันทุกวันเที่ยงคืน
  cron.schedule('0 0 * * *', async () => {
    try {
      // หา earn transactions ที่หมดอายุแล้วและยังไม่ถูก expire
      const [rows] = await pool.query(`
        SELECT pt.user_id, SUM(pt.amount) AS total_expire
        FROM point_transactions pt
        WHERE pt.type = 'earn'
          AND pt.expires_at IS NOT NULL
          AND pt.expires_at < CURDATE()
          AND NOT EXISTS (
            SELECT 1 FROM point_transactions pt2
            WHERE pt2.user_id = pt.user_id
              AND pt2.type = 'expire'
              AND pt2.ref = CONCAT('expire_', pt.txn_id)
          )
        GROUP BY pt.user_id
      `);

      for (const row of rows) {
        const expireAmount = Math.abs(row.total_expire);
        if (expireAmount <= 0) continue;

        // หา transactions ที่หมดอายุ
        const [expiredTxns] = await pool.query(`
          SELECT txn_id, amount FROM point_transactions
          WHERE user_id = ? AND type = 'earn' AND expires_at < CURDATE()
            AND NOT EXISTS (
              SELECT 1 FROM point_transactions pt2
              WHERE pt2.user_id = point_transactions.user_id
                AND pt2.type = 'expire'
                AND pt2.ref = CONCAT('expire_', point_transactions.txn_id)
            )
        `, [row.user_id]);

        const conn = await pool.getConnection();
        try {
          await conn.beginTransaction();

          for (const txn of expiredTxns) {
            await conn.query(
              "INSERT INTO point_transactions (user_id, amount, type, ref) VALUES (?, ?, 'expire', ?)",
              [row.user_id, -txn.amount, `expire_${txn.txn_id}`]
            );
          }

          await conn.query(
            'UPDATE point_balances SET balance = GREATEST(0, balance - ?) WHERE user_id = ?',
            [expireAmount, row.user_id]
          );

          await conn.commit();
          console.log(`[PointsExpire] user ${row.user_id}: expired ${expireAmount} points`);
        } catch (err) {
          await conn.rollback();
          console.error(`[PointsExpire] user ${row.user_id} error:`, err.message);
        } finally {
          conn.release();
        }
      }
    } catch (err) {
      console.error('[PointsExpire] job error:', err.message);
    }
  });
  console.log('[PointsExpire] job started (daily midnight)');
}

module.exports = { startPointsExpireJob };
