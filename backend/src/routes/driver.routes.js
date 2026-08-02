'use strict';

const express = require('express');
const router  = express.Router();

const driverController  = require('../controllers/DriverController');
const authController    = require('../controllers/AuthController');
const { authenticate, authorizeDriver } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  registerDriverRules,
  updateAvailabilityRules,
} = require('../validators/driverValidators');
const { loginDriverRules } = require('../validators/authValidators');

/**
 * @swagger
 * /api/drivers/register:
 *   post:
 *     summary: Register a new driver
 *     tags: [Drivers]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, phone, password, vehicleType, vehicleModel, vehicleRegNo]
 *             properties:
 *               name:          { type: string }
 *               email:         { type: string }
 *               phone:         { type: string }
 *               password:      { type: string }
 *               city:          { type: string }
 *               address:       { type: string }
 *               vehicleType:   { type: string }
 *               vehicleModel:  { type: string }
 *               vehicleRegNo:  { type: string }
 *               vehicleYear:   { type: number }
 *     responses:
 *       201: { description: "Driver registered" }
 */
router.post('/register', registerDriverRules, validate, (req, res, next) =>
  driverController.registerDriver(req, res, next));

/**
 * @swagger
 * /api/drivers/login:
 *   post:
 *     summary: Driver login
 *     tags: [Drivers]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier, password]
 *             properties:
 *               identifier: { type: string }
 *               password:   { type: string }
 *     responses:
 *       200: { description: "Driver login successful" }
 */
router.post('/login', loginDriverRules, validate, (req, res, next) =>
  authController.loginDriver(req, res, next));

// ─── Protected driver routes (require driver JWT) ──────────────────────────

/**
 * @swagger
 * /api/driver/profile:
 *   get:
 *     summary: Get driver profile
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: "Driver profile" }
 */
router.get('/profile', authenticate, authorizeDriver, (req, res, next) =>
  driverController.getProfile(req, res, next));

/**
 * @swagger
 * /api/driver/bookings:
 *   get:
 *     summary: Get driver's assigned bookings
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: "Assigned bookings" }
 */
router.get('/bookings', authenticate, authorizeDriver, (req, res, next) =>
  driverController.getAssignedBookings(req, res, next));

/**
 * @swagger
 * /api/driver/availability:
 *   put:
 *     summary: Update driver availability status
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [Available, Offline, Busy] }
 *     responses:
 *       200: { description: "Availability updated" }
 */
router.put('/availability', authenticate, authorizeDriver, updateAvailabilityRules, validate, (req, res, next) =>
  driverController.updateAvailability(req, res, next));

router.put('/accept/:id', authenticate, authorizeDriver, (req, res, next) =>
  driverController.acceptRide(req, res, next));

router.put('/reject/:id', authenticate, authorizeDriver, (req, res, next) =>
  driverController.rejectRide(req, res, next));

router.put('/start/:id', authenticate, authorizeDriver, (req, res, next) =>
  driverController.startRide(req, res, next));

router.put('/complete/:id', authenticate, authorizeDriver, (req, res, next) =>
  driverController.completeRide(req, res, next));

module.exports = router;
