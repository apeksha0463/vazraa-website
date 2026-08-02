'use strict';

const userRepo    = require('../repositories/UserRepository');
const bookingRepo = require('../repositories/BookingRepository');
const { ERROR_CODES } = require('../constants');

class CustomerService {
  async getProfile(userId) {
    const user = await userRepo.findById(userId);
    if (!user || !user.isActive) {
      const err = new Error('User not found');
      err.code = ERROR_CODES.NOT_FOUND;
      throw err;
    }
    return user;
  }

  async updateProfile(userId, { name, phone }) {
    // Ensure phone is not taken by another user
    if (phone) {
      const existing = await userRepo.findByPhone(phone);
      if (existing && existing._id.toString() !== userId) {
        const err = new Error('Phone number already in use');
        err.code = ERROR_CODES.DUPLICATE_PHONE;
        throw err;
      }
    }

    const updates = {};
    if (name)  updates.name  = name;
    if (phone) updates.phone = phone;

    return userRepo.update(userId, updates);
  }

  async getBookingHistory(userId) {
    return bookingRepo.findByCustomer(userId);
  }
}

module.exports = new CustomerService();
