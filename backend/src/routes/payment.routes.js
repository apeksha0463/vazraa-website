'use strict';

const express = require('express');
const router  = express.Router();

const paymentController = require('../controllers/PaymentController');
const { authenticate, authorizeCustomer } = require('../middleware/auth');

/**
 * @swagger
 * /api/payments/create-order:
 *   post:
 *     summary: Create a Cashfree payment order for a booking
 *     description: |
 *       Creates a Cashfree payment order using the booking's estimatedFare from the database.
 *       The frontend MUST NOT send an amount — the backend reads it from MongoDB.
 *       Returns a paymentSessionId for use with the Cashfree JS SDK.
 *     tags: [Payments]
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
 *               bookingId: { type: string, example: "64abc123..." }
 *     responses:
 *       200:
 *         description: Payment order created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookingId:        { type: string }
 *                     bookingNumber:    { type: string }
 *                     amount:           { type: number }
 *                     paymentSessionId: { type: string }
 *                     cashfreeOrderId:  { type: string }
 *       400: { description: "Invalid request" }
 *       403: { description: "Booking does not belong to customer" }
 *       404: { description: "Booking not found" }
 *       500: { description: "Cashfree API error" }
 */
router.post(
  '/create-order',
  authenticate,
  authorizeCustomer,
  (req, res, next) => paymentController.createOrder(req, res, next)
);

/**
 * @swagger
 * /api/payments/verify/{bookingId}:
 *   get:
 *     summary: Verify payment status for a booking via Cashfree server-side API
 *     description: |
 *       Queries Cashfree's server-side API to get the real payment status.
 *       Updates MongoDB accordingly. Does NOT trust frontend query params.
 *       Idempotent — safe to call multiple times.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Payment status verified and returned
 *       403: { description: "Access denied" }
 *       404: { description: "Booking not found" }
 */
router.get(
  '/verify/:bookingId',
  authenticate,
  authorizeCustomer,
  (req, res, next) => paymentController.verifyPayment(req, res, next)
);

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Cashfree payment webhook
 *     description: |
 *       Receives Cashfree webhook events. Verifies HMAC-SHA256 signature.
 *       Idempotent — safe to receive duplicate events.
 *       Always returns HTTP 200 immediately.
 *     tags: [Payments]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: "Webhook received" }
 */
router.post(
  '/webhook',
  (req, res, next) => paymentController.handleWebhook(req, res, next)
);

module.exports = router;
