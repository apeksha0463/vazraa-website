'use strict';

const jwt        = require('jsonwebtoken');
const authService = require('../services/AuthService');
const { errorResponse } = require('../utils/response');
const { ERROR_CODES, ROLES } = require('../constants');

/**
 * Verifies the JWT and attaches decoded payload to req.user.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return errorResponse(res, 'Access token required', ERROR_CODES.UNAUTHORIZED, 401);
  }

  try {
    const decoded = authService.verifyToken(token);
    req.user = decoded;
    return next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid token';
    return errorResponse(res, msg, ERROR_CODES.UNAUTHORIZED, 401);
  }
}

/**
 * Require customer or admin role.
 */
function authorizeCustomer(req, res, next) {
  if (!req.user || (req.user.role !== ROLES.CUSTOMER && req.user.role !== ROLES.ADMIN)) {
    return errorResponse(res, 'Customer access required', ERROR_CODES.FORBIDDEN, 403);
  }
  return next();
}

/**
 * Require driver role.
 */
function authorizeDriver(req, res, next) {
  if (!req.user || req.user.role !== ROLES.DRIVER) {
    return errorResponse(res, 'Driver access required', ERROR_CODES.FORBIDDEN, 403);
  }
  return next();
}

/**
 * Require admin role.
 */
function authorizeAdmin(req, res, next) {
  if (!req.user || req.user.role !== ROLES.ADMIN) {
    return errorResponse(res, 'Admin access required', ERROR_CODES.FORBIDDEN, 403);
  }
  return next();
}

module.exports = { authenticate, authorizeCustomer, authorizeDriver, authorizeAdmin };
