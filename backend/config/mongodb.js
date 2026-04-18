const mongoose = require('mongoose');

mongoose.set('bufferCommands', false); // fail immediately instead of buffering when not connected

const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ev_charger');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
  }
};

module.exports = connectMongoDB;