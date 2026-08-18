'use strict';

const express = require('express');
const router  = express.Router();

const adminController = require('../controllers/AdminController');
const authController  = require('../controllers/AuthController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { loginAdminRules } = require('../validators/authValidators');

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier, password]
 *             properties:
 *               identifier: { type: string, example: "admin@vazraa.com" }
 *               password:   { type: string, example: "Admin@1234" }
 *     responses:
 *       200: { description: "Admin login successful" }
 *       401: { description: "Invalid credentials" }
 */
router.post('/login', loginAdminRules, validate, (req, res, next) =>
  authController.loginAdmin(req, res, next));

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: "Dashboard stats" }
 */
router.get('/dashboard', authenticate, authorizeAdmin, (req, res, next) =>
  adminController.getDashboard(req, res, next));

router.get('/users',   authenticate, authorizeAdmin, (req, res, next) =>
  adminController.getAllUsers(req, res, next));

router.get('/drivers', authenticate, authorizeAdmin, (req, res, next) =>
  adminController.getAllDrivers(req, res, next));

router.get('/bookings', authenticate, authorizeAdmin, (req, res, next) =>
  adminController.getAllBookings(req, res, next));

router.put('/users/:id/suspend',   authenticate, authorizeAdmin, (req, res, next) =>
  adminController.suspendUser(req, res, next));

router.put('/drivers/:id/suspend', authenticate, authorizeAdmin, (req, res, next) =>
  adminController.suspendDriver(req, res, next));

router.patch('/drivers/:id/approve', authenticate, authorizeAdmin, (req, res, next) =>
  adminController.approveDriver(req, res, next));

router.put('/bookings/:id/status', authenticate, authorizeAdmin, (req, res, next) =>
  adminController.updateBookingStatus(req, res, next));

module.exports = router;
