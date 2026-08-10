'use strict';

require('dotenv').config();

const app         = require('./app');
const connectDB   = require('./config/database');
const vehicleService = require('./services/VehicleService');
const logger      = require('./utils/logger');

const PORT = process.env.PORT || 5000;

function validateEnv() {
  const missing = [];
  if (!process.env.MONGODB_URI) missing.push('MONGODB_URI');
  if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');

  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET === 'vazraa_super_secret_jwt_key_change_in_production' ||
        process.env.JWT_SECRET === 'change_me') {
      console.warn('⚠️ WARNING: Using default/insecure JWT_SECRET in production. Please set a secure key.');
    }
  }

  if (missing.length > 0) {
    console.error(`❌ CRITICAL: Missing required environment variable(s): ${missing.join(', ')}`);
    process.exit(1);
  }
}

function setupGracefulShutdown(server) {
  const handler = async (signal) => {
    console.log(`\n🛑 ${signal} received. Initiating graceful shutdown...`);
    
    // Stop HTTP server first
    server.close(async () => {
      console.log('✅ HTTP server closed.');
      
      // Close MongoDB connection
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState !== 0) {
        try {
          await mongoose.connection.close();
          console.log('✅ MongoDB connection closed.');
        } catch (err) {
          console.error('❌ Error closing MongoDB connection:', err.message);
        }
      }
      
      console.log('👋 Graceful shutdown complete.');
      process.exit(0);
    });
    
    // Safety timeout: force exit if server close hangs
    setTimeout(() => {
      console.error('❌ Forceful exit initiated after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => handler('SIGTERM'));
  process.on('SIGINT', () => handler('SIGINT'));
}

async function start() {
  validateEnv();

  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Seed default vehicles if collection is empty
    await vehicleService.seedDefaultVehicles();

    // 3. Seed admin account if not present
    await seedAdmin();

    // 4. Start HTTP server
    const server = app.listen(PORT, () => {
      console.log('');
      console.log('╔══════════════════════════════════════════╗');
      console.log('║     🚖  Vazraa Mobility Backend  🚖       ║');
      console.log('╠══════════════════════════════════════════╣');
      console.log(`║  Server   : http://localhost:${PORT}         ║`);
      console.log(`║  Swagger  : http://localhost:${PORT}/api-docs ║`);
      console.log(`║  Health   : http://localhost:${PORT}/health   ║`);
      console.log('╚══════════════════════════════════════════╝');
      console.log('');
    });

    setupGracefulShutdown(server);
  } catch (err) {
    logger.error('Failed to start server', { error: err.message });
    process.exit(1);
  }
}

async function seedAdmin() {
  try {
    const bcrypt   = require('bcryptjs');
    const User     = require('./models/User');
    const { ROLES } = require('./constants');

    const adminEmail    = process.env.ADMIN_EMAIL    || 'admin@vazraa.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@1234';
    const adminName     = process.env.ADMIN_NAME     || 'Vazraa Admin';

    const existing = await User.findOne({ email: adminEmail });
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    if (!existing) {
      await User.create({
        name:         adminName,
        email:        adminEmail,
        phone:        '0000000000',
        passwordHash,
        role:         ROLES.ADMIN,
      });
      console.log(`✅  Admin seeded: ${adminEmail} / ${adminPassword}`);
    } else {
      await User.updateOne({ email: adminEmail }, {
        $set: { passwordHash, role: ROLES.ADMIN, isActive: true }
      });
      console.log(`✅  Admin reset: ${adminEmail} / ${adminPassword}`);
    }
  } catch (err) {
    logger.warn('Admin seed skipped', { error: err.message });
  }
}

start();
