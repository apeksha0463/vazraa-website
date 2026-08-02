'use strict';

const express = require('express');
const router  = express.Router();

const vehicleController = require('../controllers/VehicleController');

/**
 * @swagger
 * /api/vehicles:
 *   get:
 *     summary: Get all vehicles
 *     tags: [Vehicles]
 *     security: []
 *     responses:
 *       200: { description: "List of vehicles" }
 */
router.get('/', (req, res, next) => vehicleController.getAllVehicles(req, res, next));

/**
 * @swagger
 * /api/vehicles/categories:
 *   get:
 *     summary: Get all vehicle categories (alias for /api/vehicles)
 *     tags: [Vehicles]
 *     security: []
 *     responses:
 *       200: { description: "Vehicle categories" }
 */
router.get('/categories', (req, res, next) => vehicleController.getAllVehicles(req, res, next));

/**
 * @swagger
 * /api/vehicles/{category}:
 *   get:
 *     summary: Get a single vehicle by category
 *     tags: [Vehicles]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema: { type: string }
 *         description: e.g. car, bike, bus, commercial, van, ev
 *     responses:
 *       200: { description: "Vehicle details" }
 *       404: { description: "Not found" }
 */
router.get('/:category', (req, res, next) => vehicleController.getVehicleByCategory(req, res, next));

module.exports = router;
