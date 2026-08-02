'use strict';

const Booking = require('../models/Booking');
const { BOOKING_STATUS } = require('../constants');

class BookingRepository {
  async create(data) {
    const booking = new Booking(data);
    return booking.save();
  }

  async findById(id) {
    return Booking.findById(id)
      .populate('customerId', '-passwordHash')
      .populate('driverId', '-passwordHash');
  }

  async findByBookingNumber(bookingNumber) {
    return Booking.findOne({ bookingNumber })
      .populate('customerId', '-passwordHash')
      .populate('driverId', '-passwordHash');
  }

  async findByCustomer(customerId, options = {}) {
    const { skip = 0, limit = 50, sort = { createdAt: -1 } } = options;
    return Booking.find({ customerId })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('driverId', '-passwordHash');
  }

  async findByDriver(driverId, options = {}) {
    const { skip = 0, limit = 50, sort = { createdAt: -1 } } = options;
    return Booking.find({ driverId })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('customerId', '-passwordHash');
  }

  async findActiveByCustomer(customerId) {
    const activeStatuses = [
      BOOKING_STATUS.PENDING,
      BOOKING_STATUS.DRIVER_ASSIGNED,
      BOOKING_STATUS.DRIVER_ACCEPTED,
      BOOKING_STATUS.DRIVER_EN_ROUTE,
      BOOKING_STATUS.RIDE_STARTED,
    ];
    return Booking.findOne({ customerId, bookingStatus: { $in: activeStatuses } });
  }

  async findActiveByDriver(driverId) {
    const activeStatuses = [
      BOOKING_STATUS.DRIVER_ASSIGNED,
      BOOKING_STATUS.DRIVER_ACCEPTED,
      BOOKING_STATUS.DRIVER_EN_ROUTE,
      BOOKING_STATUS.RIDE_STARTED,
    ];
    return Booking.findOne({ driverId, bookingStatus: { $in: activeStatuses } });
  }

  async updateStatus(id, status, extra = {}) {
    return Booking.findByIdAndUpdate(
      id,
      { $set: { bookingStatus: status, ...extra } },
      { new: true },
    );
  }

  async update(id, data) {
    return Booking.findByIdAndUpdate(id, { $set: data }, { new: true });
  }

  async findAll(filters = {}, options = {}) {
    const { skip = 0, limit = 50, sort = { createdAt: -1 } } = options;
    return Booking.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('customerId', '-passwordHash')
      .populate('driverId', '-passwordHash');
  }

  async count(filters = {}) {
    return Booking.countDocuments(filters);
  }
}

module.exports = new BookingRepository();
