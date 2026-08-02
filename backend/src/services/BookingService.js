'use strict';

const bookingRepo = require('../repositories/BookingRepository');
const driverRepo  = require('../repositories/DriverRepository');
const vehicleRepo = require('../repositories/VehicleRepository');
const vehicleService = require('./VehicleService');
const { generateBookingNumber } = require('../utils/bookingNumber');
const {
  BOOKING_STATUS, BOOKING_SOURCE, DRIVER_STATUS,
  ERROR_CODES, PAYMENT_STATUS,
} = require('../constants');

const MOCK_DISTANCE_KM = 12; // Fixed mock — Google Maps future

class BookingService {
  /**
   * Create a new booking from website or chatbot.
   */
  async createBooking({
    customerId,
    vehicleType,
    vehicleCategory,
    pickup,
    drop,
    scheduledDate,
    scheduledTime,
    passengers,
    bookingSource = BOOKING_SOURCE.WEBSITE,
    pickupCoords,
    dropCoords,
  }) {
    // 1. Enforce one-active-booking rule
    const activeBooking = await bookingRepo.findActiveByCustomer(customerId);
    if (activeBooking) {
      const err = new Error('You already have an active booking. Please complete or cancel it first.');
      err.code = ERROR_CODES.ACTIVE_BOOKING_EXISTS;
      throw err;
    }

    // 2. Resolve vehicle category / name
    let resolvedCategory = vehicleCategory;
    let resolvedName     = vehicleType;
    let vehicle          = null;

    if (vehicleCategory) {
      vehicle = await vehicleRepo.findByCategory(vehicleCategory);
    }
    if (!vehicle && vehicleType) {
      // Try to match by name (frontend sends e.g. "Car & Sedan")
      vehicle = await vehicleRepo.findAll().then(list =>
        list.find(v => v.name.toLowerCase() === vehicleType.toLowerCase() ||
                       v.category === vehicleType.toLowerCase())
      );
    }

    if (vehicle) {
      resolvedCategory = vehicle.category;
      resolvedName     = vehicle.name;
    }

    // 3. Calculate fare
    const distanceKm    = MOCK_DISTANCE_KM;
    const estimatedFare = vehicle
      ? vehicleService.calculateFare(vehicle, distanceKm)
      : 0;

    // 4. Generate OTP (4 digits, mock)
    const rideOtp = String(Math.floor(1000 + Math.random() * 9000));

    // 5. Generate booking number
    const bookingNumber = generateBookingNumber();

    // 6. Auto-assign first available driver (best-effort, non-blocking)
    let driverId           = null;
    let bookingStatus      = BOOKING_STATUS.PENDING;
    const availableDriver  = await driverRepo.findAvailable();

    if (availableDriver) {
      driverId      = availableDriver._id;
      bookingStatus = BOOKING_STATUS.DRIVER_ASSIGNED;
      await driverRepo.update(availableDriver._id, {
        status: DRIVER_STATUS.BUSY,
        currentBookingId: null,  // will be set after booking is created
      });
    }

    // 7. Persist
    const booking = await bookingRepo.create({
      bookingNumber,
      customerId,
      driverId,
      vehicleType:     resolvedName     || vehicleType,
      vehicleCategory: resolvedCategory || vehicleCategory || vehicleType,
      pickup,
      drop,
      scheduledDate,
      scheduledTime,
      passengers,
      estimatedDistance: distanceKm,
      estimatedFare,
      bookingStatus,
      paymentStatus: PAYMENT_STATUS.PENDING,
      bookingSource,
      rideOtp,
      pickupCoords,
      dropCoords,
    });

    // Update driver's currentBookingId now that booking _id is known
    if (availableDriver) {
      await driverRepo.update(availableDriver._id, { currentBookingId: booking._id });
    }

    return booking;
  }

  async getBooking(bookingId) {
    const booking = await bookingRepo.findById(bookingId);
    if (!booking) {
      const err = new Error('Booking not found');
      err.code = ERROR_CODES.BOOKING_NOT_FOUND;
      throw err;
    }
    return booking;
  }

  async getBookingByNumber(bookingNumber) {
    return bookingRepo.findByBookingNumber(bookingNumber);
  }

  async getHistory(customerId) {
    return bookingRepo.findByCustomer(customerId);
  }

  async cancelBooking(bookingId, cancelledBy = 'customer', cancelReason = '') {
    const booking = await bookingRepo.findById(bookingId);
    if (!booking) {
      const err = new Error('Booking not found');
      err.code = ERROR_CODES.BOOKING_NOT_FOUND;
      throw err;
    }

    const nonCancellableStatuses = [BOOKING_STATUS.RIDE_COMPLETED, BOOKING_STATUS.CANCELLED];
    if (nonCancellableStatuses.includes(booking.bookingStatus)) {
      const err = new Error('This booking cannot be cancelled');
      err.code = ERROR_CODES.CANNOT_CANCEL;
      throw err;
    }

    // Free driver
    if (booking.driverId) {
      await driverRepo.update(booking.driverId, {
        status: DRIVER_STATUS.AVAILABLE,
        currentBookingId: null,
      });
    }

    return bookingRepo.updateStatus(bookingId, BOOKING_STATUS.CANCELLED, {
      cancelledBy,
      cancelReason,
    });
  }

  /**
   * Mock tracking response — Google Maps integration is future scope.
   */
  async trackBooking(bookingId) {
    const booking = await bookingRepo.findById(bookingId);
    if (!booking) {
      const err = new Error('Booking not found');
      err.code = ERROR_CODES.BOOKING_NOT_FOUND;
      throw err;
    }

    return {
      bookingNumber: booking.bookingNumber,
      bookingStatus: booking.bookingStatus,
      pickup:        booking.pickup,
      drop:          booking.drop,
      vehicleType:   booking.vehicleType,
      estimatedFare: booking.estimatedFare,
      driver: booking.driverId
        ? {
            name:  booking.driverId.name,
            phone: booking.driverId.phone,
          }
        : null,
      // Mock location — will be replaced by live GPS in future
      driverLocation: { lat: 12.9716, lng: 77.5946 },
      etaMinutes: 8,
      message: '[Mock] Driver location is simulated. Live tracking coming soon.',
    };
  }

  async updateBookingStatus(bookingId, status) {
    return bookingRepo.updateStatus(bookingId, status);
  }
}

module.exports = new BookingService();
