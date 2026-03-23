const mongoose = require('mongoose');
require('dotenv').config();

const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    // Do not exit process — app can run without MongoDB (logs are optional)
  }
};

module.exports = connectMongoDB;
