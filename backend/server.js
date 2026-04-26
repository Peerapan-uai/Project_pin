require('dotenv').config();
const rateLimit = require('express-rate-limit');
const express = require('express');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const pool = require('./config/db');
const connectMongoDB = require('./config/mongodb');
const logger = require('./middleware/logger');
const auth = require('./middleware/auth');
const roleCheck = require('./middleware/roleCheck');
const cron = require('node-cron')

const { startExpireJob } = require('./jobs/expireBookings');
const { startExpirePaymentsJob } = require('./jobs/expirePayments');
const { startTemperatureSimulator } = require('./jobs/temperatureSimulator');
const { startNoShowChecker } = require('./jobs/noShowChecker');
const { startPointsExpireJob } = require('./jobs/pointsExpire');
const { startRecurringBookingsGenJob } = require('./jobs/recurringBookingsGen');
const { startIdleFeeAutoStopJob } = require('./jobs/idleFeeAutoStop');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const vehicleRoutes = require('./routes/vehicles');
const stationRoutes = require('./routes/stations');
const chargerRoutes = require('./routes/chargers');
const bookingRoutes = require('./routes/bookings');
const sessionRoutes = require('./routes/sessions');
const paymentRoutes = require('./routes/payments');
const reviewRoutes = require('./routes/reviews');
const ticketRoutes = require('./routes/tickets');
const notificationRoutes = require('./routes/notifications');
const walletRoutes = require('./routes/wallet');
const favoritesRoutes = require('./routes/favorites');
const pointsRoutes = require('./routes/points');
const adminWalletRoutes = require('./routes/admin/wallet');
const adminReportsRoutes = require('./routes/admin/reports');
const adminNotificationsRoutes = require('./routes/admin/notifications');
const logsRoutes = require('./routes/admin/logs');
const adminRefundsRoutes = require('./routes/admin/refunds')
const adminTrashRoutes   = require('./routes/admin/trash')
const recurringBookingsRoutes = require('./routes/recurringBookings')
const tripPlanRoutes = require('./routes/tripPlan')

const app = express();

// ─── Core Middleware ───────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'ลองใหม่ใน 15 นาที' }
});
app.use('/api/auth/login', loginLimiter);
app.use('/api/admin/login', loginLimiter);
app.use(express.json({ limit: '10mb' })); // รองรับ base64 image
app.use(logger); // morgan + MongoDB logger

// ─── Static Files ─────────────────────────────────────────────────────────────
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// ─── Swagger / OpenAPI ────────────────────────────────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EV Charger Booking API',
      version: '1.0.0',
      description: 'REST API for the EV Charging Station Booking web application',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
    apis: ['./routes/*.js', './routes/admin/*.js', './server.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/chargers', chargerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/admin/logs', logsRoutes);
app.use('/api/admin/wallet', adminWalletRoutes);
app.use('/api/admin/reports', adminReportsRoutes);
app.use('/api/admin/refunds', adminRefundsRoutes)
app.use('/api/admin/trash',   adminTrashRoutes)

app.use('/api/admin/notifications', adminNotificationsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/recurring-bookings', recurringBookingsRoutes);
app.use('/api/trip-plan', tripPlanRoutes);

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get dashboard statistics (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_users:
 *                   type: integer
 *                 bookings_today:
 *                   type: integer
 *                 payments_count:
 *                   type: number
 *                 charger_issue:
 *                   type: integer
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
// lalla  GET	/api/admin/stats	Get dashboard statistics
app.get('/api/admin/stats', auth, roleCheck('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
    (SELECT COUNT(*) FROM users WHERE role = 'user') AS total_users,
    (SELECT COUNT(*) FROM bookings  WHERE DATE( booking_time) = curdate()) AS bookings_today,
    (SELECT sum(amount) from payments ) as payments_count ,
    (SELECT COUNT(charger_id) from chargers where status = 'out_of_service' ) as charger_issue
  `);
    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ message: 'Server error fetching stats.' });
  }
});
app.get('/', (req, res) => {
  res.json({ message: 'EV Charger API is running.' });
});
// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error.' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Test MySQL connection
  try {
    const conn = await pool.getConnection();
    console.log('MySQL connected successfully');
    conn.release();
  } catch (err) {
    console.error('MySQL connection error:', err.message);
  }

  // Connect to MongoDB
  await connectMongoDB();

  const startScheduleNotificationsJob = () => {
    cron.schedule('* * * * *', async () => {
      try {
        const [pending] = await pool.query(
          `select * from scheduled_notifications
          where scheduled_at <= NOW() AND is_sent = 0`
        )
        for (const notif of pending) {
            let userIds = []
            if (notif.target_type === 'all') {
              const [users] = await pool.query(`select user_id from users`)
              userIds = users.map(u => u.user_id)

            } else if (notif.target_type === 'role') {
              const [users] = await pool.query('select user_id from users where role = ?', [notif.target_value])
              userIds = users.map(u => u.user_id)

            } else if (notif.target_type === 'user_ids') {
              userIds = notif.target_value.split(',').map(id => parseInt(id.trim()))
            }
            if (userIds.length > 0) {
              const insertValues = userIds.map(id => [
                id,
                notif.title,
                notif.message,
                notif.type
              ])
              await pool.query(
                'insert into notifications (user_id, title, message, type) values ?', [insertValues]
              )
              await pool.query(
                'update scheduled_notifications set is_sent = 1 where id = ?',
                [notif.id]
              )
            } 
        } 
      } catch (err) {console.error('Scheduled notification error:', err.message)}
    })
  }
  // cron: เช็คและอัปเดตสถานะสถานีที่ตั้งเวลาไว้ (ทุก 1 นาที)
  const startStationScheduleJob = () => {
    cron.schedule('* * * * *', async () => {
      try {
        const [due] = await pool.query(
          `SELECT station_id, scheduled_status FROM stations
           WHERE scheduled_status IS NOT NULL AND scheduled_status_at <= NOW()`
        )
        for (const s of due) {
          await pool.query(
            `UPDATE stations SET status = ?, scheduled_status = NULL, scheduled_status_at = NULL
             WHERE station_id = ?`,
            [s.scheduled_status, s.station_id]
          )
        }
        if (due.length > 0) console.log(`[StationSchedule] อัปเดต ${due.length} สถานี`)
      } catch (err) { console.error('Station schedule job error:', err.message) }
    })
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
    startExpireJob();
    startExpirePaymentsJob();
    startTemperatureSimulator();
    startNoShowChecker();
    startPointsExpireJob();
    startRecurringBookingsGenJob();
    startIdleFeeAutoStopJob();
    startScheduleNotificationsJob()
    startStationScheduleJob()
  });
};
// module.exports = router;
startServer();
