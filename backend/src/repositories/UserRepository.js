'use strict';

const User = require('../models/User');

class UserRepository {
  async findById(id) {
    return User.findById(id);
  }

  async findByEmail(email) {
    return User.findOne({ email: email.toLowerCase() });
  }

  async findByPhone(phone) {
    return User.findOne({ phone });
  }

  async findByEmailOrPhone(identifier) {
    return User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { phone: identifier }],
    });
  }

  async create(data) {
    const user = new User(data);
    return user.save();
  }

  async update(id, data) {
    return User.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  }

  async softDelete(id) {
    return User.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true });
  }

  async findAll(filters = {}, options = {}) {
    const { skip = 0, limit = 50, sort = { createdAt: -1 } } = options;
    const query = { ...filters };
    return User.find(query).sort(sort).skip(skip).limit(limit);
  }

  async count(filters = {}) {
    return User.countDocuments(filters);
  }
}

module.exports = new UserRepository();
