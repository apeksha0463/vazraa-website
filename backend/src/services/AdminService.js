'use strict';

const userRepo    = require('../repositories/UserRepository');
const driverRepo  = require('../repositories/DriverRepository');
const bookingRepo = require('../repositories/BookingRepository');
const { BOOKING_STATUS, DRIVER_STATUS } = require('../constants');

class AdminService {
  async getDashboardStats() {
    const [
      totalUsers,
      totalDrivers,
      totalBookings,
      pendingBookings,
      activeBookings,
      completedBookings,
      cancelledBookings,
      availableDrivers,
    ] = await Promise.all([
      userRepo.count({ role: 'customer' }),
      driverRepo.count(),
      bookingRepo.count(),
      bookingRepo.count({ bookingStatus: BOOKING_STATUS.PENDING }),
      bookingRepo.count({ bookingStatus: { $in: [
        BOOKING_STATUS.DRIVER_ASSIGNED,
        BOOKING_STATUS.DRIVER_ACCEPTED,
        BOOKING_STATUS.DRIVER_EN_ROUTE,
        BOOKING_STATUS.RIDE_STARTED,
      ]}},),
      bookingRepo.count({ bookingStatus: BOOKING_STATUS.RIDE_COMPLETED }),
      bookingRepo.count({ bookingStatus: BOOKING_STATUS.CANCELLED }),
      driverRepo.count({ status: DRIVER_STATUS.AVAILABLE }),
    ]);

    return {
      totalUsers,
      totalDrivers,
      totalBookings,
      pendingBookings,
      activeBookings,
      completedBookings,
      cancelledBookings,
      availableDrivers,
    };
  }

  async getAllUsers(filters = {}) {
    return userRepo.findAll({ role: 'customer', ...filters });
  }

  async getAllDrivers(filters = {}) {
    return driverRepo.findAll(filters);
  }

  async getAllBookings(filters = {}) {
    return bookingRepo.findAll(filters);
  }

  async suspendUser(userId) {
    return userRepo.softDelete(userId);
  }

  async suspendDriver(driverId) {
    return driverRepo.update(driverId, { isActive: false, status: DRIVER_STATUS.SUSPENDED });
  }

  async updateBookingStatus(bookingId, status) {
    return bookingRepo.updateStatus(bookingId, status);
  }
}

module.exports = new AdminService();
