'use strict';

const bookingService = require('../services/BookingService');
const { successResponse, errorResponse } = require('../utils/response');
const { BOOKING_SOURCE, ERROR_CODES } = require('../constants');

class BookingController {
  /**
   * POST /api/bookings
   */
  async createBooking(req, res, next) {
    try {
      const {
        vehicleType,
        vehicleCategory,
        pickup,
        drop,
        scheduledDate,
        scheduledTime,
        passengers,
        pickupCoords,
        dropCoords,
      } = req.body;

      const booking = await bookingService.createBooking({
        customerId: req.user.id,
        vehicleType,
        vehicleCategory,
        pickup,
        drop,
        scheduledDate,
        scheduledTime,
        passengers,
        bookingSource: BOOKING_SOURCE.WEBSITE,
        pickupCoords,
        dropCoords,
      });

      return successResponse(
        res,
        {
          bookingId:     booking._id,
          bookingNumber: booking.bookingNumber,
          estimatedFare: booking.estimatedFare,
          status:        booking.bookingStatus,
          rideOtp:       booking.rideOtp,
          booking,
        },
        'Booking created successfully',
        201,
      );
    } catch (err) {
      if (err.code === ERROR_CODES.ACTIVE_BOOKING_EXISTS) {
        return errorResponse(res, err.message, err.code, 409);
      }
      return next(err);
    }
  }

  /**
   * GET /api/bookings/history
   * GET /api/bookings/history/:customerId  (admin)
   */
  async getHistory(req, res, next) {
    try {
      const customerId = req.params.customerId || req.user.id;
      const bookings   = await bookingService.getHistory(customerId);
      return successResponse(res, { bookings, count: bookings.length }, 'Booking history retrieved');
    } catch (err) {
      return next(err);
    }
  }

  /**
   * GET /api/bookings/:id
   */
  async getBooking(req, res, next) {
    try {
      const booking = await bookingService.getBooking(req.params.id);
      return successResponse(res, { booking }, 'Booking retrieved');
    } catch (err) {
      if (err.code === ERROR_CODES.BOOKING_NOT_FOUND) return errorResponse(res, err.message, err.code, 404);
      return next(err);
    }
  }

  /**
   * GET /api/bookings/:id/track
   */
  async trackBooking(req, res, next) {
    try {
      const tracking = await bookingService.trackBooking(req.params.id);
      return successResponse(res, tracking, 'Tracking data retrieved');
    } catch (err) {
      if (err.code === ERROR_CODES.BOOKING_NOT_FOUND) return errorResponse(res, err.message, err.code, 404);
      return next(err);
    }
  }

  /**
   * PUT /api/bookings/cancel
   */
  async cancelBooking(req, res, next) {
    try {
      const { bookingId, cancelReason } = req.body;
      const booking = await bookingService.cancelBooking(bookingId, 'customer', cancelReason);
      return successResponse(res, { booking }, 'Booking cancelled successfully');
    } catch (err) {
      if (err.code === ERROR_CODES.BOOKING_NOT_FOUND) return errorResponse(res, err.message, err.code, 404);
      if (err.code === ERROR_CODES.CANNOT_CANCEL) return errorResponse(res, err.message, err.code, 400);
      return next(err);
    }
  }
}

module.exports = new BookingController();
