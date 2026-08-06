const mongoose = require('mongoose');
const Log = require('../models/Log');

const SENSITIVE = ['password', 'token', 'secret', 'apiKey', 'creditCard', 'cvv', 'pin'];
const sanitizeBody = (body) => {
  if (!body) return body;
  const clean = { ...body };
  for (const key of Object.keys(clean))
    if (SENSITIVE.some(s => key.toLocaleLowerCase().includes(s))) clean[key] = '[REDACTED]';
  return clean;
};

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