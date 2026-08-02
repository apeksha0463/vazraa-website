'use strict';

const mongoose = require('mongoose');

/**
 * Connects to MongoDB. Retries automatically on failure.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vazraa';

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅  MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('❌  MongoDB connection error:', err.message);
    console.log('🔄  Retrying in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
}

module.exports = connectDB;
