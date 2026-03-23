const morgan = require('morgan');
const Log = require('../models/Log');

// Standard HTTP logging to console using morgan dev format
const morganMiddleware = morgan('dev');

// Custom middleware that saves each request to MongoDB
const mongoLogger = (req, res, next) => {
  const startTime = Date.now();

  // Override res.end to capture the status code and response time after the response is sent
  const originalEnd = res.end.bind(res);

  res.end = function (...args) {
    const responseTime = Date.now() - startTime;

    // Save log to MongoDB asynchronously — do not block the response
    setImmediate(async () => {
      try {
        const logEntry = new Log({
          method: req.method,
          url: req.originalUrl || req.url,
          statusCode: res.statusCode,
          userId: req.user ? req.user.user_id || req.user.id || null : null,
          userRole: req.user ? req.user.role || null : null,
          ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'] || '',
          responseTime,
          body: req.method !== 'GET' ? sanitizeBody(req.body) : {},
          timestamp: new Date(),
        });
        await logEntry.save();
      } catch (err) {
        // Gracefully ignore MongoDB errors — logging should never crash the app
        console.error('MongoDB log error:', err.message);
      }
    });

    return originalEnd(...args);
  };

  next();
};

// Remove sensitive fields before storing in MongoDB
function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return {};
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'password_hash', 'token', 'secret'];
  sensitiveFields.forEach((field) => {
    if (sanitized[field]) sanitized[field] = '[REDACTED]';
  });
  return sanitized;
}

// Combined logger: morgan to console + mongo persistence
const logger = [morganMiddleware, mongoLogger];

module.exports = logger;
