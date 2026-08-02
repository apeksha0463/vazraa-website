'use strict';

const Vehicle = require('../models/Vehicle');

class VehicleRepository {
  async findAll(filters = {}) {
    return Vehicle.find(filters).sort({ pricePerKm: 1 });
  }

  async findByCategory(category) {
    return Vehicle.findOne({ category: category.toLowerCase() });
  }

  async findById(id) {
    return Vehicle.findById(id);
  }

  async create(data) {
    const v = new Vehicle(data);
    return v.save();
  }

  async update(id, data) {
    return Vehicle.findByIdAndUpdate(id, { $set: data }, { new: true });
  }

  async count() {
    return Vehicle.countDocuments();
  }

  async upsertByCategory(data) {
    return Vehicle.findOneAndUpdate(
      { category: data.category },
      { $set: data },
      { upsert: true, new: true },
    );
  }
}

module.exports = new VehicleRepository();
