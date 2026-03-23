const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  method: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  statusCode: {
    type: Number,
    required: true,
  },
  userId: {
    type: Number,
    default: null,
  },
  userRole: {
    type: String,
    default: null,
  },
  ip: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  responseTime: {
    type: Number, // milliseconds
  },
  body: {
    type: Object,
    default: {},
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Log = mongoose.model('Log', logSchema);

module.exports = Log;
