'use strict';

const express = require('express');
const router  = express.Router();

const customerController = require('../controllers/CustomerController');
const { authenticate, authorizeCustomer } = require('../middleware/auth');

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get customer profile
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: "Profile retrieved" }
 *       401: { description: "Unauthorized" }
 */
router.get('/', authenticate, authorizeCustomer, (req, res, next) =>
  customerController.getProfile(req, res, next));

/**
 * @swagger
 * /api/profile:
 *   put:
 *     summary: Update customer profile
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:  { type: string }
 *               phone: { type: string }
 *     responses:
 *       200: { description: "Profile updated" }
 */
router.put('/', authenticate, authorizeCustomer, (req, res, next) =>
  customerController.updateProfile(req, res, next));

module.exports = router;
