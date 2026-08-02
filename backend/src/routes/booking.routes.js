'use strict';

const express = require('express');
const router  = express.Router();

const bookingController = require('../controllers/BookingController');
const { authenticate, authorizeCustomer } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createBookingRules, cancelBookingRules } = require('../validators/bookingValidators');

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pickup, drop, vehicleType]
 *             properties:
 *               pickup:        { type: string, example: "RT Nagar" }
 *               drop:          { type: string, example: "Majestic" }
 *               vehicleType:   { type: string, example: "Car & Sedan" }
 *               vehicleCategory: { type: string, example: "car" }
 *               scheduledDate: { type: string, example: "2025-12-01" }
 *               scheduledTime: { type: string, example: "10:30" }
 *               passengers:    { type: string, example: "2 Passengers" }
 *     responses:
 *       201: { description: "Booking created" }
 *       409: { description: "Active booking already exists" }
 */
router.post('/', authenticate, authorizeCustomer, createBookingRules, validate, (req, res, next) =>
  bookingController.createBooking(req, res, next));

/**
 * @swagger
 * /api/bookings/history:
 *   get:
 *     summary: Get booking history for logged-in customer
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: "Booking history" }
 */
router.get('/history', authenticate, authorizeCustomer, (req, res, next) =>
  bookingController.getHistory(req, res, next));

/**
 * @swagger
 * /api/bookings/history/{customerId}:
 *   get:
 *     summary: Get booking history for a specific customer (admin)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: "Booking history" }
 */
router.get('/history/:customerId', authenticate, (req, res, next) =>
  bookingController.getHistory(req, res, next));

/**
 * @swagger
 * /api/bookings/cancel:
 *   put:
 *     summary: Cancel a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId]
 *             properties:
 *               bookingId:    { type: string }
 *               cancelReason: { type: string }
 *     responses:
 *       200: { description: "Booking cancelled" }
 */
router.put('/cancel', authenticate, authorizeCustomer, cancelBookingRules, validate, (req, res, next) =>
  bookingController.cancelBooking(req, res, next));

/**
 * @swagger
 * /api/bookings/{id}/track:
 *   get:
 *     summary: Track a booking (mock data in v1)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: "Tracking data" }
 */
router.get('/:id/track', authenticate, authorizeCustomer, (req, res, next) =>
  bookingController.trackBooking(req, res, next));

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get a single booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: "Booking details" }
 *       404: { description: "Booking not found" }
 */
router.get('/:id', authenticate, authorizeCustomer, (req, res, next) =>
  bookingController.getBooking(req, res, next));

module.exports = router;
