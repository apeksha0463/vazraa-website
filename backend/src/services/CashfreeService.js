'use strict';

/**
 * CashfreeService
 * ──────────────────────────────────────────────────────────────────────────────
 * Handles all server-side communication with the Cashfree Payments API.
 *
 * Environment variables required:
 *   CASHFREE_CLIENT_ID      — Your Cashfree App ID
 *   CASHFREE_CLIENT_SECRET  — Your Cashfree Secret Key  ← BACKEND ONLY, NEVER exposed to frontend
 *   CASHFREE_ENV            — "sandbox" | "production"
 *   CASHFREE_API_VERSION    — e.g. "2025-01-01"
 *   CASHFREE_RETURN_URL     — Base return URL for the payment result page
 */

const axios  = require('axios');
const crypto = require('crypto');

// ─── Config ────────────────────────────────────────────────────────────────────
const CF_ENV        = (process.env.CASHFREE_ENV || 'sandbox').toLowerCase();
const CF_VERSION    = process.env.CASHFREE_API_VERSION || '2025-01-01';
const CF_CLIENT_ID  = process.env.CASHFREE_CLIENT_ID  || '';
const CF_SECRET     = process.env.CASHFREE_CLIENT_SECRET || '';

const BASE_URL = CF_ENV === 'production'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

// Return URL — frontend page that Cashfree redirects to after payment
const RETURN_URL_BASE = process.env.CASHFREE_RETURN_URL || 'http://localhost:5000/payment-result.html';

/** Shared Axios headers for Cashfree API calls */
function cashfreeHeaders() {
  return {
    'x-client-id':     CF_CLIENT_ID,
    'x-client-secret': CF_SECRET,
    'x-api-version':   CF_VERSION,
    'Content-Type':    'application/json',
    'Accept':          'application/json',
  };
}

/**
 * Returns true if Cashfree credentials are configured.
 * Used to give meaningful errors before attempting an API call.
 */
function credentialsConfigured() {
  return !!(CF_CLIENT_ID && CF_SECRET);
}

class CashfreeService {
  /**
   * Create a Cashfree payment order for the given booking.
   *
   * @param {object} booking  — Mongoose Booking document
   * @param {object} customer — Mongoose User document (populated from booking.customerId)
   * @returns {{ orderId: string, paymentSessionId: string, cfOrderId: string }}
   */
  async createOrder(booking, customer) {
    if (!credentialsConfigured()) {
      const err = new Error(
        'Cashfree credentials are not configured. ' +
        'Set CASHFREE_CLIENT_ID and CASHFREE_CLIENT_SECRET in your .env file.'
      );
      err.code = 'CASHFREE_NOT_CONFIGURED';
      throw err;
    }

    const amount = Number(booking.estimatedFare);
    if (!amount || amount < 1) {
      const err = new Error('Booking fare must be at least ₹1 to initiate payment.');
      err.code = 'INVALID_AMOUNT';
      throw err;
    }

    // Build a unique, deterministic-enough order ID.
    // Format: vzr_<bookingNumber>_<timestamp_base36>
    // We append a timestamp suffix so retries get a fresh order ID.
    const suffix    = Date.now().toString(36).toUpperCase();
    const orderId   = `vzr_${booking.bookingNumber}_${suffix}`;

    // Return URL — Cashfree redirects here after payment
    const returnUrl = `${RETURN_URL_BASE}?bookingId=${booking._id}&order_id={order_id}`;

    // Safely extract customer details
    const customerPhone = (customer.phone || '9999999999').replace(/\D/g, '').slice(-10);
    const customerEmail = customer.email || 'customer@vazraa.com';
    const customerName  = customer.name  || 'Vazraa Customer';

    const payload = {
      order_id:       orderId,
      order_amount:   amount,
      order_currency: 'INR',
      customer_details: {
        customer_id:    String(customer._id),
        customer_name:  customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
      },
      order_meta: {
        return_url:   returnUrl,
        notify_url:   process.env.CASHFREE_WEBHOOK_URL || '',
      },
      order_note: `Vazraa Ride — Booking ${booking.bookingNumber}`,
    };

    let response;
    try {
      response = await axios.post(`${BASE_URL}/orders`, payload, {
        headers: cashfreeHeaders(),
        timeout: 15000,
      });
    } catch (axiosErr) {
      // Extract Cashfree error message safely (no secret in logs)
      const cfMsg = axiosErr.response?.data?.message || axiosErr.message || 'Cashfree API unavailable';
      const err   = new Error(`Cashfree order creation failed: ${cfMsg}`);
      err.code    = 'CASHFREE_API_ERROR';
      err.status  = axiosErr.response?.status || 503;
      throw err;
    }

    const data = response.data;

    if (!data.payment_session_id) {
      const err = new Error('Cashfree did not return a payment session. Please try again.');
      err.code  = 'CASHFREE_NO_SESSION';
      throw err;
    }

    return {
      orderId:          data.order_id,
      paymentSessionId: data.payment_session_id,
      cfOrderStatus:    data.order_status,
    };
  }

  /**
   * Fetch the current order status from Cashfree.
   *
   * @param {string} cashfreeOrderId — The order_id we stored on the booking
   * @returns {object} raw Cashfree order object
   */
  async getOrderStatus(cashfreeOrderId) {
    if (!credentialsConfigured()) {
      const err = new Error('Cashfree credentials are not configured.');
      err.code  = 'CASHFREE_NOT_CONFIGURED';
      throw err;
    }

    let response;
    try {
      response = await axios.get(`${BASE_URL}/orders/${cashfreeOrderId}`, {
        headers: cashfreeHeaders(),
        timeout: 15000,
      });
    } catch (axiosErr) {
      const cfMsg = axiosErr.response?.data?.message || axiosErr.message;
      const err   = new Error(`Failed to fetch Cashfree order status: ${cfMsg}`);
      err.code    = 'CASHFREE_API_ERROR';
      err.status  = axiosErr.response?.status || 503;
      throw err;
    }

    return response.data;
  }

  /**
   * Map Cashfree order_status string → our internal PAYMENT_STATUS constant value.
   *
   * Cashfree order statuses: ACTIVE | PAID | EXPIRED | TERMINATED
   * Cashfree payment statuses on individual payments: SUCCESS | FAILED | USER_DROPPED | PENDING
   *
   * @param {object} cfOrder — raw Cashfree order response
   * @returns {'Paid'|'Pending'|'Failed'}
   */
  mapPaymentStatus(cfOrder) {
    const orderStatus = (cfOrder.order_status || '').toUpperCase();
    if (orderStatus === 'PAID') return 'Paid';
    if (orderStatus === 'EXPIRED' || orderStatus === 'TERMINATED') return 'Failed';
    // ACTIVE = still in-progress or user dropped
    return 'Pending';
  }

  /**
   * Verify a Cashfree webhook signature.
   *
   * Cashfree signs webhooks using HMAC-SHA256.
   * Signature input: `timestamp.rawBody`
   * Header: `x-webhook-signature`
   * Header: `x-webhook-timestamp`
   *
   * @param {string} rawBody   — raw request body string
   * @param {string} signature — value of x-webhook-signature header
   * @param {string} timestamp — value of x-webhook-timestamp header
   * @returns {boolean}
   */
  verifyWebhookSignature(rawBody, signature, timestamp) {
    if (!CF_SECRET || !signature || !timestamp) return false;
    try {
      const signatureData = `${timestamp}${rawBody}`;
      const expected = crypto
        .createHmac('sha256', CF_SECRET)
        .update(signatureData)
        .digest('base64');
      // Constant-time comparison to prevent timing attacks
      return crypto.timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(signature)
      );
    } catch {
      return false;
    }
  }
}

module.exports = new CashfreeService();
