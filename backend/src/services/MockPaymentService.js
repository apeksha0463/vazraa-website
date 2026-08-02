'use strict';

/**
 * MockPaymentService
 * Placeholder for Cashfree payment gateway integration.
 * All methods return mock data.
 * Replace with real Cashfree SDK calls in future.
 */
class MockPaymentService {
  /**
   * @returns {{ orderId: string, status: string, amount: number }}
   */
  createOrder(bookingId, amount) {
    return {
      orderId: `MOCK_ORDER_${Date.now()}`,
      bookingId,
      amount,
      currency: 'INR',
      status: 'pending',
      message: '[Mock] Cashfree integration is not yet enabled.',
    };
  }

  /**
   * @returns {{ orderId: string, status: string }}
   */
  verifyPayment(orderId) {
    return {
      orderId,
      status: 'mock',
      message: '[Mock] Payment verification is not yet enabled.',
    };
  }
}

module.exports = new MockPaymentService();
