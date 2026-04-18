const mongoose = require('mongoose');
const Log = require('../models/Log');

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
      body: req.method !== 'GET' ? req.body : {},
      createdAt: new Date()
    };
    Log.create(logData).catch(err => console.error('Log error:', err));
  });
  next();
};

module.exports = logger;