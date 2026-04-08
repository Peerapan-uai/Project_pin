require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const pool = require('./config/db');
const connectMongoDB = require('./config/mongodb');
const logger = require('./middleware/logger');
const auth = require('./middleware/auth');
const roleCheck = require('./middleware/roleCheck');

const { startExpireJob } = require('./jobs/expireBookings');
const { startExpirePaymentsJob } = require('./jobs/expirePayments');

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
const logsRoutes = require('./routes/admin/logs');

const app = express();

// ─── Core Middleware ───────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(logger); // morgan + MongoDB logger

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
  apis: ['./routes/*.js', './server.js'], // JSDoc comments in route files are picked up here
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
app.use('/api/notifications', notificationRoutes);

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

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
    startExpireJob();
    startExpirePaymentsJob();
  });
};

startServer();
