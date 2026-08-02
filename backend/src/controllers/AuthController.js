'use strict';

const authService = require('../services/AuthService');
const { successResponse, errorResponse } = require('../utils/response');
const { ERROR_CODES } = require('../constants');

class AuthController {
  /**
   * POST /api/auth/register
   */
  async registerCustomer(req, res, next) {
    try {
      const { name, email, phone, password } = req.body;
      const { token, user } = await authService.registerCustomer({ name, email, phone, password });
      return successResponse(res, { token, userId: user._id, user }, 'Registration successful', 201);
    } catch (err) {
      if ([ERROR_CODES.DUPLICATE_EMAIL, ERROR_CODES.DUPLICATE_PHONE].includes(err.code)) {
        return errorResponse(res, err.message, err.code, 409);
      }
      return next(err);
    }
  }

  /**
   * POST /api/auth/login
   */
  async loginCustomer(req, res, next) {
    try {
      const { identifier, password } = req.body;
      const { token, user } = await authService.loginCustomer(identifier, password);
      return successResponse(res, { token, user }, 'Login successful');
    } catch (err) {
      if (err.code === ERROR_CODES.INVALID_CREDENTIALS) {
        return errorResponse(res, err.message, err.code, 401);
      }
      return next(err);
    }
  }

  /**
   * POST /api/drivers/login
   */
  async loginDriver(req, res, next) {
    try {
      const { identifier, password } = req.body;
      const { token, driver } = await authService.loginDriver(identifier, password);
      return successResponse(res, { token, driver }, 'Driver login successful');
    } catch (err) {
      if (err.code === ERROR_CODES.INVALID_CREDENTIALS) {
        return errorResponse(res, err.message, err.code, 401);
      }
      return next(err);
    }
  }

  /**
   * POST /api/admin/login
   */
  async loginAdmin(req, res, next) {
    try {
      const { identifier, password } = req.body;
      const { token, user } = await authService.loginAdmin(identifier, password);
      return successResponse(res, { token, user }, 'Admin login successful');
    } catch (err) {
      if (err.code === ERROR_CODES.INVALID_CREDENTIALS) {
        return errorResponse(res, err.message, err.code, 401);
      }
      return next(err);
    }
  }
}

module.exports = new AuthController();
