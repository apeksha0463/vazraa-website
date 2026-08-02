'use strict';

const logger = require('../utils/logger');

/**
 * Global error handler.
 * Must be registered last in Express middleware chain.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  logger.error('Unhandled error', { message: err.message, stack: err.stack, path: req.path });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, message: messages[0], errorCode: 'VALIDATION_ERROR' });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
      errorCode: field === 'email' ? 'DUPLICATE_EMAIL' : 'DUPLICATE_PHONE',
    });
  }

  // Known application error (thrown by services)
  if (err.code && typeof err.code === 'string') {
    return res.status(400).json({ success: false, message: err.message, errorCode: err.code });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Invalid or expired token', errorCode: 'UNAUTHORIZED' });
  }

  // Default 500
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    errorCode: 'INTERNAL_ERROR',
  });
}

module.exports = errorHandler;
