'use strict';

const bcrypt     = require('bcryptjs');
const driverRepo = require('../repositories/DriverRepository');
const bookingRepo = require('../repositories/BookingRepository');
const { DRIVER_STATUS, BOOKING_STATUS, ERROR_CODES } = require('../constants');

const SALT_ROUNDS = 12;

class DriverService {
  async registerDriver(data) {
    const { name, email, phone, password, city, address,
            vehicleType, vehicleModel, vehicleRegNo, vehicleYear } = data;

    // Uniqueness checks
    const existingEmail = await driverRepo.findByEmail(email);
    if (existingEmail) {
      const err = new Error('Email already registered');
      err.code = ERROR_CODES.DUPLICATE_EMAIL;
      throw err;
    }
    const existingPhone = await driverRepo.findByPhone(phone);
    if (existingPhone) {
      const err = new Error('Phone number already registered');
      err.code = ERROR_CODES.DUPLICATE_PHONE;
      throw err;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const driver = await driverRepo.create({
      name, email, phone, passwordHash, city, address,
      vehicleType, vehicleModel, vehicleRegNo, vehicleYear,
      status: DRIVER_STATUS.OFFLINE,
    });

    return driver;
  }

  async getProfile(driverId) {
    const driver = await driverRepo.findById(driverId);
    if (!driver) {
      const err = new Error('Driver not found');
      err.code = ERROR_CODES.NOT_FOUND;
      throw err;
    }
    return driver;
  }

  async updateAvailability(driverId, status) {
    if (!Object.values(DRIVER_STATUS).includes(status)) {
      const err = new Error('Invalid status value');
      err.code = ERROR_CODES.VALIDATION_ERROR;
      throw err;
    }
    return driverRepo.update(driverId, { status });
  }

  async getAssignedBookings(driverId) {
    return bookingRepo.findByDriver(driverId);
  }

  async acceptRide(driverId, bookingId) {
    const booking = await bookingRepo.findById(bookingId);
    if (!booking) {
      const err = new Error('Booking not found');
      err.code = ERROR_CODES.BOOKING_NOT_FOUND;
      throw err;
    }
    if (booking.bookingStatus !== BOOKING_STATUS.DRIVER_ASSIGNED) {
      const err = new Error('This booking cannot be accepted in its current state');
      err.code = ERROR_CODES.CANNOT_CANCEL;
      throw err;
    }
    const updated = await bookingRepo.updateStatus(bookingId, BOOKING_STATUS.DRIVER_ACCEPTED);
    return updated;
  }

  async rejectRide(driverId, bookingId) {
    const booking = await bookingRepo.findById(bookingId);
    if (!booking) {
      const err = new Error('Booking not found');
      err.code = ERROR_CODES.BOOKING_NOT_FOUND;
      throw err;
    }
    // Free the driver and reset booking to pending
    await driverRepo.update(driverId, { status: DRIVER_STATUS.AVAILABLE, currentBookingId: null });
    const updated = await bookingRepo.updateStatus(bookingId, BOOKING_STATUS.PENDING, {
      driverId: null,
    });
    return updated;
  }

  async startRide(driverId, bookingId, otp) {
    const booking = await bookingRepo.findById(bookingId);
    if (!booking) {
      const err = new Error('Booking not found');
      err.code = ERROR_CODES.BOOKING_NOT_FOUND;
      throw err;
    }
    if (booking.rideOtp && booking.rideOtp !== otp) {
      const err = new Error('Invalid OTP');
      err.code = ERROR_CODES.INVALID_OTP;
      throw err;
    }
    const updated = await bookingRepo.updateStatus(bookingId, BOOKING_STATUS.RIDE_STARTED);
    await driverRepo.update(driverId, { status: DRIVER_STATUS.BUSY });
    return updated;
  }

  async completeRide(driverId, bookingId) {
    const booking = await bookingRepo.findById(bookingId);
    if (!booking) {
      const err = new Error('Booking not found');
      err.code = ERROR_CODES.BOOKING_NOT_FOUND;
      throw err;
    }
    const updated = await bookingRepo.updateStatus(bookingId, BOOKING_STATUS.RIDE_COMPLETED);
    await driverRepo.update(driverId, {
      status: DRIVER_STATUS.AVAILABLE,
      currentBookingId: null,
      $inc: { totalRides: 1 },
    });
    return updated;
  }
}

module.exports = new DriverService();
