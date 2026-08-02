'use strict';

const adminService = require('../services/AdminService');
const { successResponse, errorResponse } = require('../utils/response');

class AdminController {
  /**
   * GET /api/admin/dashboard
   */
  async getDashboard(req, res, next) {
    try {
      const stats = await adminService.getDashboardStats();
      return successResponse(res, stats, 'Dashboard stats retrieved');
    } catch (err) {
      return next(err);
    }
  }

  /**
   * GET /api/admin/users
   */
  async getAllUsers(req, res, next) {
    try {
      const users = await adminService.getAllUsers();
      return successResponse(res, { users, count: users.length }, 'Users retrieved');
    } catch (err) {
      return next(err);
    }
  }

  /**
   * GET /api/admin/drivers
   */
  async getAllDrivers(req, res, next) {
    try {
      const drivers = await adminService.getAllDrivers();
      return successResponse(res, { drivers, count: drivers.length }, 'Drivers retrieved');
    } catch (err) {
      return next(err);
    }
  }

  /**
   * GET /api/admin/bookings
   */
  async getAllBookings(req, res, next) {
    try {
      const bookings = await adminService.getAllBookings();
      return successResponse(res, { bookings, count: bookings.length }, 'Bookings retrieved');
    } catch (err) {
      return next(err);
    }
  }

  /**
   * PUT /api/admin/users/:id/suspend
   */
  async suspendUser(req, res, next) {
    try {
      const user = await adminService.suspendUser(req.params.id);
      return successResponse(res, { user }, 'User suspended');
    } catch (err) {
      return next(err);
    }
  }

  /**
   * PUT /api/admin/drivers/:id/suspend
   */
  async suspendDriver(req, res, next) {
    try {
      const driver = await adminService.suspendDriver(req.params.id);
      return successResponse(res, { driver }, 'Driver suspended');
    } catch (err) {
      return next(err);
    }
  }

  /**
   * PUT /api/admin/bookings/:id/status
   */
  async updateBookingStatus(req, res, next) {
    try {
      const { status } = req.body;
      const booking = await adminService.updateBookingStatus(req.params.id, status);
      return successResponse(res, { booking }, 'Booking status updated');
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new AdminController();
