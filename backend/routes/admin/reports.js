const express = require('express');
const router = express.Router();
const pool = require('../../config/db');
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');
const { AsyncParser } = require('@json2csv/node');
const puppeteer = require('puppeteer');

/**
 * @swagger
 * /api/admin/reports/revenue:
 *   get:
 *     summary: Get revenue report by period (Admin only)
 *     tags: [Admin Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         required: true
 *         schema:
 *           type: string
 *           enum: ['daily', 'monthly', 'yearly']
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date
 *         description: YYYY-MM-DD
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date
 *         description: YYYY-MM-DD
 *       - in: query
 *         name: station_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Revenue report
 *       400:
 *         description: Invalid parameters
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */



router.get('/revenue', auth, roleCheck('admin'), async (req, res) => {
    try {
        const { period, from_date, to_date, station_id } = req.query;

        if (!period || !['daily', 'monthly', 'yearly'].includes(period)) {
            return res.status(400).json({ message: 'period must be: daily, monthly, or yearly' });
        }
        const toDate = to_date ? new Date(to_date) : new Date();
        const fromDate =  from_date ? new Date(from_date) : new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        let groupByClause;
        if (period === 'daily') {
            groupByClause = 'DATE(p.paid_at)';
        } else if (period === 'monthly') {
            groupByClause = 'DATE_FORMAT(p.paid_at, "%Y-%m")';
        } else {
            groupByClause = 'DATE_FORMAT(p.paid_at, "%Y")'
        }

        let sql = `
            SELECT
              DATE_FORMAT(p.paid_at,
                CASE
                   WHEN ? = 'daily' THEN '%Y-%m-%d'
                   WHEN ? = 'monthly' THEN '%Y-%m'
                   ELSE '%Y'
                END
              ) AS period_date,
              SUM(p.amount) AS revenue,
              count(p.payment_id) AS transaction_count
              FROM payments p
              WHERE p.status = 'completed'
                AND p.paid_at >= ?
                AND p.paid_at <= ?
                `;

                const params = [period, period, fromDate, toDate];

                if (station_id && station_id !== 'null') {
                    sql += ` AND p.session_id IN (
                       SELECT session_id FROM charging_sessions
                       WHERE charger_id IN (
                         select charger_id FROM chargers WHERE station_id = ?
                         )
                        )`;
                        params.push(station_id);
                }

                sql += ` GROUP BY DATE_FORMAT(p.paid_at,
                    CASE
                        WHEN ? = 'daily' THEN '%Y-%m-%d'
                        WHEN ? = 'monthly' THEN '%Y-%m'
                        ELSE '%Y'
                       END
                     ) ORDER BY period_date DESC`;

                     params.push(period, period);

                     const [rows] = await pool.query(sql, params);

                     const totalRevenue = rows.reduce((sum, row) => sum + parseFloat(row.revenue || 0), 0); 
                     const totalTransactions = rows.reduce((sum, row) => sum + (row.transaction_count || 0), 0);

                     return res.status(200).json({
                        period,
                        from_date: fromDate.toISOString().split('T')[0],
                        to_date: toDate.toISOString().split('T')[0],
                        station_id: station_id ? parseInt(station_id) : null,
                        data: rows,
                        summary: {
                            total_revenue: totalRevenue,
                            average_per_transaction: totalRevenue > 0 ? (totalRevenue / totalTransactions).toFixed(2) : 0
                        }
                    });
    } catch (error) {
        console.error('Revenue report error:', error);
        return res.status(500).json({ message: 'Server error generating revenue report.'});
    }
});

/**
 * @swagger
 * /api/admin/reports/usage:
 *   get:
 *     summary: Get charger usage statistics (Admin only)
 *     tags: [Admin Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *         description: YYYY-MM-DD
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *         description: YYYY-MM-DD
 *     responses:
 *       200:
 *         description: Usage report
 *       500:
 *         description: Server error
 */


// 🔴 TODO A: Query charger utilization stats
// lalla GET /api/admin/reports/usage
router.get('/usage', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { from_date, to_date, status } = req.query;
    const fromDate = from_date ? new Date(from_date) : new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to_date ? new Date(to_date) : new Date();

    let statusCondition = '';
    const params = [fromDate, toDate];
    if (status && ['completed', 'charging', 'failed', 'stopped'].includes(status)) {
      statusCondition = ' AND cs.status = ?';
      params.push(status);
    }

    const [usageData] = await pool.query(
        `SELECT
        c.charger_id, c.charger_name, c.station_id,
        COUNT(cs.session_id) as total_sessions,
        SUM(cs.energy_kwh) as total_energy_kwh,
         AVG(cs.energy_kwh) as avg_energy_kwh,
        MAX(c.temperature_celsius) as max_temperature
        FROM chargers c
        LEFT JOIN charging_sessions cs ON c.charger_id = cs.charger_id
        AND cs.start_time >= ? AND cs.start_time <= ?${statusCondition}
        GROUP BY c.charger_id`,
        params
    );

    return res.status(200).json({
      success: true,
      period: `${fromDate.toISOString().split('T')[0]} to ${toDate.toISOString().split('T')[0]}`,
      data: usageData
    });
  } catch (error) {
    console.error('Usage report error:', error);
    return res.status(500).json({ message: 'Server error generating usage report.' });
  }
});

/**
 * @swagger
 * /api/admin/reports/stations:
 *   get:
 *     summary: Get statistics per station (Admin only)
 *     tags: [Admin Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stations statistics
 *       500:
 *         description: Server error
 */
// lalla GET /api/admin/reports/stations
router.get('/stations', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    const fromDate = from_date ? new Date(from_date) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const toDate = to_date ? new Date(to_date + 'T23:59:59') : new Date();

    const [stationsStats] = await pool.query(
        `SELECT
         s.station_id, s.name,
         COUNT(DISTINCT b.booking_id) as total_bookings,
         COUNT(DISTINCT cs.session_id) as total_sessions,
         COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) as total_revenue,
         COUNT(DISTINCT c.charger_id) as total_chargers
        FROM stations s
        LEFT JOIN chargers c ON s.station_id = c.station_id
        LEFT JOIN bookings b ON c.charger_id = b.charger_id
        LEFT JOIN charging_sessions cs ON b.booking_id = cs.booking_id
          AND cs.start_time >= ? AND cs.start_time <= ?
        LEFT JOIN payments p ON cs.session_id = p.session_id
        GROUP BY s.station_id`,
        [fromDate, toDate]
    );
    return res.status(200).json({
      success: true,
      data: stationsStats
    });
  } catch (error) {
    console.error('Stations report error:', error);
    return res.status(500).json({ message: 'Server error generating stations report.' });
  }
});

/**
 * @swagger
 * /api/admin/reports/comparison:
 *   get:
 *     summary: Compare revenue with previous period (Admin only)
 *     tags: [Admin Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: compare_type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [monthly, yearly]
 *     responses:
 *       200:
 *         description: Comparison report
 *       500:
 *         description: Server error
 */
// lalla GET /api/admin/reports/comparison
router.get('/comparison', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { compare_type = 'monthly' } = req.query;

    const now = new Date();
    let currentStart, currentEnd, previousStart, previousEnd;
    let currentLabel, previousLabel;

    if (compare_type === 'daily') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const yesterdayEnd = new Date(todayStart.getTime() - 1);
      currentStart = todayStart;
      currentEnd = now;
      previousStart = yesterdayStart;
      previousEnd = yesterdayEnd;
      currentLabel = 'วันนี้';
      previousLabel = 'เมื่อวาน';
    } else if (compare_type === 'weekly') {
      const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
      const thisMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
      const lastMonday = new Date(thisMonday.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastSunday = new Date(thisMonday.getTime() - 1);
      currentStart = thisMonday;
      currentEnd = now;
      previousStart = lastMonday;
      previousEnd = lastSunday;
      currentLabel = 'สัปดาห์นี้';
      previousLabel = 'สัปดาห์ที่แล้ว';
    } else {
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
      currentEnd = now;
      previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      previousEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      currentLabel = 'เดือนนี้';
      previousLabel = 'เดือนที่แล้ว';
    }

    const [[currentRow]] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS revenue FROM payments WHERE status = 'completed' AND paid_at >= ? AND paid_at <= ?`,
      [currentStart, currentEnd]
    );
    const [[previousRow]] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS revenue FROM payments WHERE status = 'completed' AND paid_at >= ? AND paid_at <= ?`,
      [previousStart, previousEnd]
    );

    const currentRevenue = parseFloat(currentRow.revenue || 0);
    const previousRevenue = parseFloat(previousRow.revenue || 0);
    const percentageChange = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(2)
      : currentRevenue > 0 ? 100 : 0;

    return res.status(200).json({
      success: true,
      compare_type,
      current_revenue: currentRevenue,
      previous_revenue: previousRevenue,
      current_label: currentLabel,
      previous_label: previousLabel,
      percentage_change: percentageChange
    });
  } catch (error) {
    console.error('Comparison report error:', error);
    return res.status(500).json({ message: 'Server error generating comparison report.' });
  }
});

/**
 * @swagger
 * /api/admin/reports/export:
 *   post:
 *     summary: Export report as CSV (Admin only)
 *     tags: [Admin Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               report_type:
 *                 type: string
 *                 enum: [revenue, usage, stations]
 *               from_date:
 *                 type: string
 *               to_date:
 *                 type: string
 *     responses:
 *       200:
 *         description: CSV file
 *       400:
 *         description: Invalid report type
 *       500:
 *         description: Server error
 */
// lalla POST /api/admin/reports/export
router.post('/export', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { report_type, from_date, to_date } = req.body;

    if (!report_type || !['revenue', 'usage', 'stations'].includes(report_type)) {
      return res.status(400).json({ message: 'Invalid report_type' });
    }

    // 🔴 TODO E: Query data based on report_type

    let query;
    let params = [];
    const fromDate = from_date ? new Date(from_date) : new Date();
    const toDate = to_date ? new Date(to_date) : new Date();

    if (report_type === 'revenue') {
      query = `SELECT payment_id, amount, method, paid_at FROM payments WHERE paid_at >= ? AND paid_at <= ?`
      params = [fromDate, toDate];  
    } else if (report_type === 'usage') {
      query = `SELECT cs.session_id, cs.charger_id, c.charger_name, cs.energy_kwh, cs.start_time, cs.end_time, cs.status
               FROM charging_sessions cs
               JOIN chargers c ON cs.charger_id = c.charger_id
               WHERE cs.start_time >= ? AND cs.start_time <= ?`
      params = [fromDate, toDate];
    } else if (report_type === 'stations') {
      query = `SELECT station_id, name, address FROM stations`
      params = [];  
    }

    const [data] = await pool.query(query, params);

    // 🔴 TODO F: Convert to CSV using @json2csv/node
    const parser = new AsyncParser({ withBOM: true });
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${report_type}_${Date.now()}.csv"`);

    parser.parse(data).pipe(res);
  } catch (error) {
    console.error('Export report error:', error);
    return res.status(500).json({ message: 'Server error exporting report.' });
  }

});

/**
 * @swagger
 * /api/admin/reports/payments/{paymentId}/invoice:
 *   get:
 *     summary: Export payment invoice as PDF (Admin only)
 *     tags: [Admin Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: PDF invoice file
 *       403:
 *         description: Access denied
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
// lalla GET /api/admin/payments/{id}/invoice
router.get('/payments/:paymentId/invoice', auth, roleCheck('admin'), async (req, res) => {
  let browser;
  try {
    const { paymentId } = req.params;
    const [paymentData] = await pool.query(
      `SELECT
        p.payment_id, p.amount, p.method, p.status, p.paid_at,
        u.first_name, u.last_name, u.email, u.phone,
        cs.energy_kwh, cs.start_time, cs.end_time,
        c.charger_name, c.power_kw,
        s.name as station_name, s.address
      FROM payments p
      JOIN users u ON p.user_id = u.user_id
      JOIN charging_sessions cs ON p.session_id = cs.session_id
      JOIN chargers c ON cs.charger_id = c.charger_id
      JOIN stations s ON c.station_id = s.station_id
      WHERE p.payment_id = ?`,
      [paymentId]
    );

    if (paymentData.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const d = paymentData[0];
    const paidDate = d.paid_at ? new Date(d.paid_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '-';
    const methodLabel = { credit_card: 'บัตรเครดิต/เดบิต', wallet: 'กระเป๋าเงิน', promptpay: 'พร้อมเพย์' }[d.method] || d.method || '-';

    browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    const htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Sarabun', 'Helvetica Neue', sans-serif; padding: 50px; color: #1a1a1a; }
            .header { text-align: center; border-bottom: 2px solid #22c55e; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { font-size: 24px; color: #22c55e; margin-bottom: 4px; }
            .header p { font-size: 13px; color: #888; }
            .info-grid { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .info-box p { font-size: 13px; line-height: 1.8; }
            .info-box strong { color: #555; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #f8f8f8; text-align: left; padding: 10px 14px; font-size: 13px; color: #555; border-bottom: 2px solid #e5e5e5; }
            td { padding: 12px 14px; font-size: 14px; border-bottom: 1px solid #eee; }
            .amount { text-align: right; font-weight: 700; color: #22c55e; font-size: 16px; }
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #aaa; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ใบเสร็จการชาร์จ EV</h1>
            <p>Invoice #${d.payment_id}</p>
          </div>
          <div class="info-grid">
            <div class="info-box">
              <p><strong>ชื่อผู้ใช้:</strong> ${d.first_name || ''} ${d.last_name || ''}</p>
              <p><strong>อีเมล:</strong> ${d.email || '-'}</p>
              <p><strong>เบอร์โทร:</strong> ${d.phone || '-'}</p>
            </div>
            <div class="info-box" style="text-align:right">
              <p><strong>วันที่ชำระ:</strong> ${paidDate}</p>
              <p><strong>วิธีชำระ:</strong> ${methodLabel}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>รายละเอียด</th>
                <th>ข้อมูล</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>สถานี</td><td>${d.station_name || '-'}</td></tr>
              <tr><td>ตู้ชาร์จ</td><td>${d.charger_name || '-'} (${d.power_kw || '-'} kW)</td></tr>
              <tr><td>พลังงานที่ใช้</td><td>${d.energy_kwh != null ? Number(d.energy_kwh).toFixed(2) : '-'} kWh</td></tr>
              <tr>
                <td style="font-weight:600">ยอดชำระ</td>
                <td class="amount">${d.amount != null ? Number(d.amount).toFixed(2) : '-'} ฿</td>
              </tr>
            </tbody>
          </table>
          <div class="footer">
            <p>ขอบคุณที่ใช้บริการ EV Charging Station</p>
          </div>
        </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();
    browser = null;

    const buf = Buffer.from(pdfBuffer);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', buf.length);
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${paymentId}.pdf"`);
    return res.end(buf);

  } catch (error) {
    if (browser) try { await browser.close(); } catch (_) {}
    console.error('Generate invoice error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate invoice',
      error: error.message
    });
  }
});

// POST /api/admin/reports/export-pdf
router.post('/export-pdf', auth, roleCheck('admin'), async (req, res) => {
  let browser;
  try {
    const { report_type, from_date, to_date } = req.body;

    if (!report_type || !['revenue', 'usage', 'stations'].includes(report_type)) {
      return res.status(400).json({ message: 'Invalid report_type' });
    }

    const fromDate = from_date ? new Date(from_date + 'T00:00:00') : new Date();
    const toDate = to_date ? new Date(to_date + 'T23:59:59') : new Date();
    const fmtFrom = fromDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
    const fmtTo = toDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });

    let query, params = [], title, headers, mapRow;

    if (report_type === 'revenue') {
      title = 'รายงานรายได้';
      headers = ['#', 'วันที่', 'จำนวนเงิน (฿)', 'วิธีชำระ', 'สถานะ'];
      query = `SELECT payment_id, amount, method, status, paid_at FROM payments WHERE paid_at >= ? AND paid_at <= ? ORDER BY paid_at DESC`;
      params = [fromDate, toDate];
      const methodLabel = { credit_card: 'บัตรเครดิต', wallet: 'กระเป๋าเงิน', promptpay: 'พร้อมเพย์' };
      const statusLabel = { completed: 'สำเร็จ', pending: 'รอดำเนินการ', refunded: 'คืนเงินแล้ว' };
      mapRow = (r, i) => `<tr><td>${i + 1}</td><td>${new Date(r.paid_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td><td style="text-align:right;font-weight:600">${Number(r.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td><td>${methodLabel[r.method] || r.method}</td><td>${statusLabel[r.status] || r.status}</td></tr>`;
    } else if (report_type === 'usage') {
      title = 'รายงานการใช้งาน';
      headers = ['#', 'ตู้ชาร์จ', 'เริ่ม', 'สิ้นสุด', 'พลังงาน (kWh)', 'สถานะ'];
      query = `SELECT cs.session_id, c.charger_name, cs.start_time, cs.end_time, cs.energy_kwh, cs.status
               FROM charging_sessions cs JOIN chargers c ON cs.charger_id = c.charger_id
               WHERE cs.start_time >= ? AND cs.start_time <= ? ORDER BY cs.start_time DESC`;
      params = [fromDate, toDate];
      const sLabel = { completed: 'เสร็จสิ้น', charging: 'กำลังชาร์จ', failed: 'ล้มเหลว', stopped: 'หยุด' };
      mapRow = (r, i) => `<tr><td>${i + 1}</td><td>${r.charger_name}</td><td>${r.start_time ? new Date(r.start_time).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}</td><td>${r.end_time ? new Date(r.end_time).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}</td><td style="text-align:right">${r.energy_kwh != null ? Number(r.energy_kwh).toFixed(2) : '-'}</td><td>${sLabel[r.status] || r.status}</td></tr>`;
    } else {
      title = 'รายงานสถานี';
      headers = ['#', 'สถานี', 'ที่อยู่'];
      query = `SELECT station_id, name, address FROM stations`;
      params = [];
      mapRow = (r, i) => `<tr><td>${i + 1}</td><td>${r.name}</td><td>${r.address || '-'}</td></tr>`;
    }

    const [data] = await pool.query(query, params);

    const html = `<html><head><meta charset="UTF-8"><style>
      @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Sarabun',sans-serif;padding:40px;color:#1a1a1a;font-size:13px}
      .header{text-align:center;border-bottom:2px solid #22c55e;padding-bottom:16px;margin-bottom:20px}
      .header h1{font-size:20px;color:#22c55e}
      .header p{font-size:12px;color:#888;margin-top:4px}
      table{width:100%;border-collapse:collapse;margin-top:8px}
      th{background:#f8f8f8;text-align:left;padding:8px 10px;font-size:12px;color:#555;border-bottom:2px solid #e5e5e5}
      td{padding:7px 10px;border-bottom:1px solid #eee;font-size:12px}
      tr:nth-child(even){background:#fafafa}
      .footer{margin-top:30px;text-align:center;font-size:10px;color:#aaa}
      .summary{margin-top:16px;text-align:right;font-size:13px;color:#333}
    </style></head><body>
      <div class="header"><h1>${title}</h1><p>${fmtFrom} — ${fmtTo}</p></div>
      <table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${data.map(mapRow).join('')}</tbody></table>
      ${data.length === 0 ? '<p style="text-align:center;color:#999;padding:30px">ไม่มีข้อมูลในช่วงเวลาที่เลือก</p>' : ''}
      <p class="summary">ทั้งหมด ${data.length} รายการ</p>
      <div class="footer"><p>EV Charging Station — รายงานอัตโนมัติ</p></div>
    </body></html>`;

    browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' } });
    await browser.close();
    browser = null;

    const buf = Buffer.from(pdfBuffer);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', buf.length);
    res.setHeader('Content-Disposition', `attachment; filename="report-${report_type}-${Date.now()}.pdf"`);
    return res.end(buf);
  } catch (error) {
    if (browser) try { await browser.close(); } catch (_) {}
    console.error('Export PDF error:', error);
    return res.status(500).json({ message: 'Server error exporting PDF.' });
  }
});

module.exports = router;