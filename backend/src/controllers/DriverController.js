'use strict';

const driverService  = require('../services/DriverService');
const { successResponse, errorResponse } = require('../utils/response');
const { ERROR_CODES } = require('../constants');

class DriverController {
  /**
   * POST /api/drivers/register
   */
  async registerDriver(req, res, next) {
    try {
      const driver = await driverService.registerDriver(req.body);
      return successResponse(res, { driverId: driver._id, driver }, 'Driver registered successfully', 201);
    } catch (err) {
      if ([ERROR_CODES.DUPLICATE_EMAIL, ERROR_CODES.DUPLICATE_PHONE].includes(err.code)) {
        return errorResponse(res, err.message, err.code, 409);
      }
      return next(err);
    }
  }

  /**
   * GET /api/driver/profile
   */
  async getProfile(req, res, next) {
    try {
      const driver = await driverService.getProfile(req.user.id);
      return successResponse(res, { driver }, 'Driver profile retrieved');
    } catch (err) {
      return next(err);
    }
  }

  /**
   * GET /api/driver/bookings
   */
  async getAssignedBookings(req, res, next) {
    try {
      const bookings = await driverService.getAssignedBookings(req.user.id);
      return successResponse(res, { bookings, count: bookings.length }, 'Assigned bookings retrieved');
    } catch (err) {
      return next(err);
    }
  }

  /**
   * PUT /api/driver/availability
   */
  async updateAvailability(req, res, next) {
    try {
      const { status } = req.body;
      const driver = await driverService.updateAvailability(req.user.id, status);
      return successResponse(res, { driver }, 'Availability updated');
    } catch (err) {
      return next(err);
    }
  }

  /**
   * PUT /api/driver/accept/:id
   */
  async acceptRide(req, res, next) {
    try {
      const booking = await driverService.acceptRide(req.user.id, req.params.id);
      return successResponse(res, { booking }, 'Ride accepted');
    } catch (err) {
      return next(err);
    }
  }

  /**
   * PUT /api/driver/reject/:id
   */
  async rejectRide(req, res, next) {
    try {
      const booking = await driverService.rejectRide(req.user.id, req.params.id);
      return successResponse(res, { booking }, 'Ride rejected');
    } catch (err) {
      return next(err);
    }
  }

  /**
   * PUT /api/driver/start/:id
   */
  async startRide(req, res, next) {
    try {
      const { otp } = req.body;
      const booking = await driverService.startRide(req.user.id, req.params.id, otp);
      return successResponse(res, { booking }, 'Ride started');
    } catch (err) {
      if (err.code === ERROR_CODES.INVALID_OTP) return errorResponse(res, err.message, err.code, 400);
      return next(err);
    }
  }

  /**
   * PUT /api/driver/complete/:id
   */
  async completeRide(req, res, next) {
    try {
      const booking = await driverService.completeRide(req.user.id, req.params.id);
      return successResponse(res, { booking }, 'Ride completed');
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new DriverController();
