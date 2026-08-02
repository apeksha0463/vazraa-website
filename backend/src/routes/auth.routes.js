'use strict';

const express = require('express');
const router  = express.Router();

const authController = require('../controllers/AuthController');
const validate       = require('../middleware/validate');
const {
  registerCustomerRules,
  loginCustomerRules,
  loginAdminRules,
} = require('../validators/authValidators');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new customer
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, phone, password]
 *             properties:
 *               name:     { type: string, example: "John Doe" }
 *               email:    { type: string, example: "john@example.com" }
 *               phone:    { type: string, example: "9876543210" }
 *               password: { type: string, example: "password123" }
 *     responses:
 *       201: { description: "Registration successful" }
 *       409: { description: "Email or phone already registered" }
 */
router.post('/register', registerCustomerRules, validate, (req, res, next) =>
  authController.registerCustomer(req, res, next));

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Customer login
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier, password]
 *             properties:
 *               identifier: { type: string, example: "john@example.com" }
 *               password:   { type: string, example: "password123" }
 *     responses:
 *       200: { description: "Login successful" }
 *       401: { description: "Invalid credentials" }
 */
router.post('/login', loginCustomerRules, validate, (req, res, next) =>
  authController.loginCustomer(req, res, next));

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
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
 */
// Note: admin login uses the same rules as customer login
router.post('/admin-login', loginAdminRules, validate, (req, res, next) =>
  authController.loginAdmin(req, res, next));

module.exports = router;
