'use strict';

const Driver = require('../models/Driver');
const { DRIVER_STATUS } = require('../constants');

class DriverRepository {
  async findById(id) {
    return Driver.findById(id);
  }

  async findByEmail(email) {
    return Driver.findOne({ email: email.toLowerCase() });
  }

  async findByPhone(phone) {
    return Driver.findOne({ phone });
  }

  async findByEmailOrPhone(identifier) {
    return Driver.findOne({
      $or: [{ email: identifier.toLowerCase() }, { phone: identifier }],
    });
  }

  async create(data) {
    const driver = new Driver(data);
    return driver.save();
  }

  async update(id, data) {
    return Driver.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  }

  async softDelete(id) {
    return Driver.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true });
  }

  async findAvailable() {
    return Driver.findOne({ status: DRIVER_STATUS.AVAILABLE, isActive: true, isVerified: true });
  }

  async findAll(filters = {}, options = {}) {
    const { skip = 0, limit = 50, sort = { createdAt: -1 } } = options;
    return Driver.find(filters).sort(sort).skip(skip).limit(limit);
  }

  async count(filters = {}) {
    return Driver.countDocuments(filters);
  }
}

module.exports = new DriverRepository();
