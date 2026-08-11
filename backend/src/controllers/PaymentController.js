'use strict';

const bookingRepo    = require('../repositories/BookingRepository');
const cashfreeService = require('../services/CashfreeService');
const { successResponse, errorResponse } = require('../utils/response');
const { ERROR_CODES, PAYMENT_STATUS } = require('../constants');
const User = require('../models/User');

class PaymentController {
  /**
   * POST /api/payments/create-order
   *
   * Creates a Cashfree payment order for an existing booking.
   * The booking's estimatedFare is used as the payment amount — never trusting frontend amounts.
   *
   * Request body: { bookingId: string }
   * Response:     { bookingId, bookingNumber, amount, paymentSessionId, cashfreeOrderId }
   */
  async createOrder(req, res, next) {
    try {
      const { bookingId } = req.body;

      if (!bookingId) {
        return errorResponse(res, 'bookingId is required', ERROR_CODES.VALIDATION_ERROR, 400);
      }

      // 1. Find the booking
      const booking = await bookingRepo.findById(bookingId);
      if (!booking) {
        return errorResponse(res, 'Booking not found', ERROR_CODES.BOOKING_NOT_FOUND, 404);
      }

      // 2. Ensure booking belongs to the logged-in customer (or admin)
      const bookingCustomerId = (booking.customerId?._id || booking.customerId)?.toString();
      const isOwner = bookingCustomerId === req.user.id.toString();
      const isAdmin = req.user.role === 'admin';
      if (!isOwner && !isAdmin) {
        return errorResponse(res, 'Access denied. This booking does not belong to you.', ERROR_CODES.FORBIDDEN, 403);
      }

      // 3. If already PAID — don't create another payment; return success
      if (booking.paymentStatus === PAYMENT_STATUS.PAID) {
        return successResponse(res, {
          alreadyPaid:   true,
          bookingId:     booking._id,
          bookingNumber: booking.bookingNumber,
          amount:        booking.paymentAmount || booking.estimatedFare,
          paymentStatus: PAYMENT_STATUS.PAID,
        }, 'Booking is already paid');
      }

      // 4. Fetch full customer record for Cashfree customer_details
      const customer = await User.findById(req.user.id).select('-passwordHash');
      if (!customer) {
        return errorResponse(res, 'Customer not found', ERROR_CODES.UNAUTHORIZED, 401);
      }

      // 5. Create Cashfree order (amount comes from DB, not frontend)
      let cfResult;
      try {
        cfResult = await cashfreeService.createOrder(booking, customer);
      } catch (cfErr) {
        // Safe error — never expose credentials in response
        const userMsg = cfErr.code === 'CASHFREE_NOT_CONFIGURED'
          ? 'Payment gateway is not configured. Please contact support.'
          : 'Unable to start payment. Please try again.';
        return errorResponse(res, userMsg, cfErr.code || ERROR_CODES.INTERNAL_ERROR, cfErr.status || 500);
      }

      // 6. Store Cashfree order details on the booking
      await bookingRepo.update(bookingId, {
        cashfreeOrderId:          cfResult.orderId,
        cashfreePaymentSessionId: cfResult.paymentSessionId,
        paymentAmount:            booking.estimatedFare,
        paymentUpdatedAt:         new Date(),
      });

      // 7. Return ONLY what the frontend needs — no secrets
      return successResponse(res, {
        bookingId:        booking._id,
        bookingNumber:    booking.bookingNumber,
        amount:           booking.estimatedFare,
        paymentSessionId: cfResult.paymentSessionId,
        cashfreeOrderId:  cfResult.orderId,
        // Booking summary for display
        pickup:        booking.pickup,
        drop:          booking.drop,
        vehicleType:   booking.vehicleType,
        scheduledDate: booking.scheduledDate,
        scheduledTime: booking.scheduledTime,
      }, 'Payment order created successfully');

    } catch (err) {
      return next(err);
    }
  }

  /**
   * GET /api/payments/verify/:bookingId
   *
   * Verifies payment status by querying Cashfree server-side.
   * Updates MongoDB with the verified status.
   * NEVER trusts frontend payment-success flags.
   */
  async verifyPayment(req, res, next) {
    try {
      const { bookingId } = req.params;

      if (!bookingId) {
        return errorResponse(res, 'bookingId is required', ERROR_CODES.VALIDATION_ERROR, 400);
      }

      // 1. Find the booking
      const booking = await bookingRepo.findById(bookingId);
      if (!booking) {
        return errorResponse(res, 'Booking not found', ERROR_CODES.BOOKING_NOT_FOUND, 404);
      }

      // 2. Ensure booking belongs to the logged-in customer (or admin)
      const bookingCustomerId = (booking.customerId?._id || booking.customerId)?.toString();
      const isOwner = bookingCustomerId === req.user.id.toString();
      const isAdmin = req.user.role === 'admin';
      if (!isOwner && !isAdmin) {
        return errorResponse(res, 'Access denied. This booking does not belong to you.', ERROR_CODES.FORBIDDEN, 403);
      }

      // 3. If no Cashfree order was created yet
      if (!booking.cashfreeOrderId) {
        return successResponse(res, {
          paymentStatus: booking.paymentStatus,
          bookingNumber: booking.bookingNumber,
          amount:        booking.estimatedFare,
          message:       'No payment order found for this booking.',
        }, 'Payment not initiated');
      }

      // 4. Query Cashfree server-side to get real status
      let cfOrder;
      try {
        cfOrder = await cashfreeService.getOrderStatus(booking.cashfreeOrderId);
      } catch (cfErr) {
        const userMsg = cfErr.code === 'CASHFREE_NOT_CONFIGURED'
          ? 'Payment gateway is not configured. Please contact support.'
          : 'Unable to verify payment status. Please try again.';
        return errorResponse(res, userMsg, cfErr.code || ERROR_CODES.INTERNAL_ERROR, cfErr.status || 500);
      }

      // 5. Map Cashfree status → our status
      const verifiedStatus = cashfreeService.mapPaymentStatus(cfOrder);

      // 6. Only update MongoDB if status has actually changed (idempotent)
      //    Never downgrade a PAID booking
      let updatedPaymentStatus = booking.paymentStatus;
      if (booking.paymentStatus !== PAYMENT_STATUS.PAID) {
        updatedPaymentStatus = verifiedStatus;
        await bookingRepo.update(bookingId, {
          paymentStatus:    verifiedStatus,
          paymentUpdatedAt: new Date(),
        });
      }

      // 7. Return verified status to frontend
      return successResponse(res, {
        paymentStatus: updatedPaymentStatus,
        bookingNumber: booking.bookingNumber,
        amount:        booking.paymentAmount || booking.estimatedFare,
        pickup:        booking.pickup,
        drop:          booking.drop,
        vehicleType:   booking.vehicleType,
        scheduledDate: booking.scheduledDate,
        scheduledTime: booking.scheduledTime,
        cashfreeOrderId: booking.cashfreeOrderId,
        cfOrderStatus: cfOrder.order_status,
      }, 'Payment status verified');

    } catch (err) {
      return next(err);
    }
  }

  /**
   * POST /api/payments/webhook
   *
   * Cashfree webhook endpoint for reliable payment status updates.
   * Verifies HMAC-SHA256 signature before processing.
   * Idempotent: safe to call multiple times with same event.
   */
  async handleWebhook(req, res, next) {
    try {
      // Respond 200 immediately to acknowledge receipt (Cashfree expects quick ack)
      res.status(200).json({ received: true });

      const signature = req.headers['x-webhook-signature'] || '';
      const timestamp = req.headers['x-webhook-timestamp'] || '';
      const rawBody   = req.rawBody || JSON.stringify(req.body);

      // 1. Verify signature
      const isValid = cashfreeService.verifyWebhookSignature(rawBody, signature, timestamp);
      if (!isValid) {
        console.warn('[Cashfree Webhook] Invalid signature — ignoring event');
        return;
      }

      const event = req.body;
      const type  = event?.type || '';
      console.log(`[Cashfree Webhook] Event received: ${type}`);

      // 2. Handle payment events
      if (type === 'PAYMENT_SUCCESS_WEBHOOK' || type === 'PAYMENT_SUCCESS') {
        await PaymentController._handleWebhookPaymentEvent(event, PAYMENT_STATUS.PAID);
      } else if (type === 'PAYMENT_FAILED_WEBHOOK' || type === 'PAYMENT_FAILED') {
        await PaymentController._handleWebhookPaymentEvent(event, PAYMENT_STATUS.FAILED);
      }
      // Other events (e.g. refunds) ignored for now

    } catch (err) {
      console.error('[Cashfree Webhook] Unhandled error:', err.message);
    }
  }

  /**
   * Internal: update booking payment status from a webhook event.
   * Idempotent — never overwrites a PAID status.
   */
  static async _handleWebhookPaymentEvent(event, newStatus) {
    try {
      const orderId = event?.data?.order?.order_id || event?.data?.payment?.order_id;
      if (!orderId) {
        console.warn('[Cashfree Webhook] No order_id in event payload');
        return;
      }

      const booking = await require('../models/Booking').findOne({ cashfreeOrderId: orderId });
      if (!booking) {
        console.warn(`[Cashfree Webhook] No booking found for orderId: ${orderId}`);
        return;
      }

      // Idempotent — never downgrade from PAID
      if (booking.paymentStatus === PAYMENT_STATUS.PAID) {
        console.log(`[Cashfree Webhook] Booking ${booking.bookingNumber} already PAID — skipping`);
        return;
      }

      await bookingRepo.update(booking._id, {
        paymentStatus:    newStatus,
        paymentUpdatedAt: new Date(),
      });

      console.log(`[Cashfree Webhook] Booking ${booking.bookingNumber} updated to ${newStatus}`);
    } catch (err) {
      console.error('[Cashfree Webhook] Error updating booking:', err.message);
    }
  }
}

const controller = new PaymentController();
// Bind static method reference for internal use
controller._handleWebhookPaymentEvent = PaymentController._handleWebhookPaymentEvent;
module.exports = controller;
