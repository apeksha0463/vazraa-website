'use strict';

const customerService = require('../services/CustomerService');
const { successResponse, errorResponse } = require('../utils/response');
const { ERROR_CODES } = require('../constants');

class CustomerController {
  /**
   * GET /api/profile
   */
  async getProfile(req, res, next) {
    try {
      const user = await customerService.getProfile(req.user.id);
      return successResponse(res, { user }, 'Profile retrieved');
    } catch (err) {
      if (err.code === ERROR_CODES.NOT_FOUND) return errorResponse(res, err.message, err.code, 404);
      return next(err);
    }
  }

  /**
   * PUT /api/profile
   */
  async updateProfile(req, res, next) {
    try {
      const { name, phone } = req.body;
      const user = await customerService.updateProfile(req.user.id, { name, phone });
      return successResponse(res, { user }, 'Profile updated');
    } catch (err) {
      if (err.code === ERROR_CODES.DUPLICATE_PHONE) return errorResponse(res, err.message, err.code, 409);
      return next(err);
    }
  }
}

module.exports = new CustomerController();
