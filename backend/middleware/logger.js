const mongoose = require('mongoose');
const Log = require('../models/Log');

const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'apikey', 'creditcard', 'cvv', 'pin', 'refreshtoken'];


function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body;
  if (Array.isArray(body)) {
    return body.map(item => sanitizeBody(item));
  }
  const clean = { ...body };
  for (const key of Object.keys(clean)) {
    if (SENSITIVE_FIELDS.some(s => key.toLowerCase().includes(s))) {
      clean[key] = '[REDACTED]';
    } else {
        clean[key] = sanitizeBody(clean[key]);
      }
  }
  return clean;
}


const logger = (req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    if (mongoose.connection.readyState !== 1) return; // skip if MongoDB not connected
    const logData = {
      method: req.method,
      url: req.path,
      statusCode: res.statusCode,
      userId: req.user?.user_id,
      responseTime: Date.now() - startTime,
      userRole: req.user?.role || null,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      body: req.method !== 'GET' ? sanitizeBody(req.body) : {},
      createdAt: new Date()
    };
    Log.create(logData).catch(err => console.error('Log error:', err));
  });
  next();
};





module.exports = logger;