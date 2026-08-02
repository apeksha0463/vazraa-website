'use strict';

require('dotenv').config();

const express        = require('express');
const helmet         = require('helmet');
const cors           = require('cors');
const morgan         = require('morgan');
const swaggerUi      = require('swagger-ui-express');
const swaggerSpec    = require('./config/swagger');

const compression    = require('compression');
const rateLimit      = require('express-rate-limit');

const authRoutes     = require('./routes/auth.routes');
const customerRoutes = require('./routes/customer.routes');
const bookingRoutes  = require('./routes/booking.routes');
const driverRoutes   = require('./routes/driver.routes');
const vehicleRoutes  = require('./routes/vehicle.routes');
const webhookRoutes  = require('./routes/webhook.routes');
const adminRoutes    = require('./routes/admin.routes');
const settingsRoutes = require('./routes/settings.routes');

const errorHandler   = require('./middleware/errorHandler');
const notFound       = require('./middleware/notFound');

const app = express();

// ─── Compression (Must be registered early) ──────────────────────────────────
app.use(compression());

// ─── Serve Frontend (static HTML files) ──────────────────────────────────────
const path = require('path');
const fs   = require('fs');
const frontendPath = path.join(__dirname, '..', '..', 'files');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
} else if (process.env.NODE_ENV !== 'production') {
  console.warn(`⚠️ Warning: Frontend static directory not found at: ${frontendPath}`);
}

// ─── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

const corsOrigin = process.env.CORS_ORIGIN || '*';
const allowedOrigins = corsOrigin.includes(',') ? corsOrigin.split(',').map(o => o.trim()) : corsOrigin;

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    errorCode: 'TOO_MANY_REQUESTS'
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Stricter limit for auth endpoints (20 per 15 mins)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes',
    errorCode: 'TOO_MANY_REQUESTS'
  }
});

// Apply rate limiter to all API routes
app.use('/api', apiLimiter);
// Apply stricter rate limiter specifically to auth endpoints
app.use('/api/auth', authLimiter);
app.use('/api/admin/login', authLimiter);

// ─── Request Parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbHealthy = mongoose.connection && mongoose.connection.readyState === 1;
  
  if (!dbHealthy) {
    return res.status(503).json({
      success: false,
      message: 'Vazraa Mobility API is unhealthy',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
  
  res.json({
    success: true,
    message: 'Vazraa Mobility API is running',
    database: 'connected',
    timestamp: new Date().toISOString()
  });
});

// ─── Swagger Docs ─────────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Vazraa Mobility API',
  customCss: '.swagger-ui .topbar { background-color: #1a1a2e; }',
}));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/profile',   customerRoutes);
app.use('/api/bookings',  bookingRoutes);
app.use('/api/drivers',   driverRoutes);
app.use('/api/driver',    driverRoutes);     // alias — frontend uses /api/driver/*
app.use('/api/vehicles',  vehicleRoutes);
app.use('/api/webhooks',  webhookRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/settings',  settingsRoutes);

// ─── 404 & Error Handlers ─────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
