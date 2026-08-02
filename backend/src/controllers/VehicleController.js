'use strict';

const vehicleService = require('../services/VehicleService');
const { successResponse } = require('../utils/response');

class VehicleController {
  /**
   * GET /api/vehicles
   * GET /api/vehicles/categories
   */
  async getAllVehicles(req, res, next) {
    try {
      const vehicles = await vehicleService.getAllVehicles();
      return successResponse(res, { vehicles, count: vehicles.length }, 'Vehicles retrieved');
    } catch (err) {
      return next(err);
    }
  }

  /**
   * GET /api/vehicles/:category
   */
  async getVehicleByCategory(req, res, next) {
    try {
      const vehicle = await vehicleService.getVehicleByCategory(req.params.category);
      if (!vehicle) {
        return res.status(404).json({ success: false, message: 'Vehicle not found', errorCode: 'NOT_FOUND' });
      }
      return successResponse(res, { vehicle }, 'Vehicle retrieved');
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new VehicleController();
