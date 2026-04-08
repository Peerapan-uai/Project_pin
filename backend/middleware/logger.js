const Log = require('../models/Log');

const logger = (req, res, next) => {
  const startTime = Date.now();
  res.on('finish', async () => {
    console.log('✅ Response finished, saving log...');
    const endTime = Date.now();

    const logData = {
      method: req.method,
      url: req.path,
      statusCode: res.statusCode,
      userId: req.user?.user_id,
      responseTime: endTime - startTime,
      userRole: req.user?.role || null,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      body: req.method !== 'GET' ? req.body : {},
      createdAt: new Date()
    };
    try {
      await Log.create(logData);
      console.log('✅ Log saved to MongoDB!');
    } catch (error) {
      console.error('Log error:', error);
    }
  });

  next();


};
module.exports = logger;