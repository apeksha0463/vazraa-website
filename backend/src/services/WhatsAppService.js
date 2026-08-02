'use strict';

const axios  = require('axios');
const logger = require('../utils/logger');

/**
 * WhatsAppService
 * All outbound WhatsApp messages go through this service.
 * If AISENSY_API_KEY is not set, messages are logged only (mock mode).
 */
class WhatsAppService {
  constructor() {
    this.apiKey  = process.env.AISENSY_API_KEY || '';
    this.baseUrl = process.env.AISENSY_BASE_URL || 'https://backend.aisensy.com/campaign/t1/api/v2';
  }

  _isMockMode() {
    return !this.apiKey || this.apiKey === 'your_aisensy_api_key_here';
  }

  async _send(phone, message) {
    if (this._isMockMode()) {
      logger.info('[WhatsApp MOCK] Message not sent — API key not configured', { phone, message });
      return { mock: true, phone, message };
    }

    try {
      const response = await axios.post(
        this.baseUrl,
        {
          apiKey:      this.apiKey,
          campaignName: 'vazraa_text',
          destination: phone,
          userName:    'Vazraa Mobility',
          templateParams: [message],
          source:      'API',
          media:       {},
          buttons:     [],
          carouselCards: [],
        },
        { timeout: 8000 },
      );
      logger.info('[WhatsApp] Message sent', { phone, status: response.status });
      return response.data;
    } catch (err) {
      logger.error('[WhatsApp] Failed to send message', { phone, error: err.message });
      // Don't throw — webhook must always return 200
      return null;
    }
  }

  async sendMessage(phone, message) {
    return this._send(phone, message);
  }

  async sendMenu(phone) {
    const menu = [
      '🚖 *Vazraa Mobility*',
      '',
      'Welcome! How can we help you today?',
      '',
      '1️⃣  Book a Ride — type *book*',
      '2️⃣  Track your Ride — type *track*',
      '3️⃣  Cancel Ride — type *cancel*',
      '4️⃣  Fare Estimate — type *fare*',
      '🆘  Emergency — type *sos*',
    ].join('\n');
    return this._send(phone, menu);
  }

  async sendBookingSummary(phone, ctx) {
    const msg = [
      '📋 *Booking Summary*',
      `📍 Pickup: ${ctx.pickup || 'N/A'}`,
      `🏁 Drop: ${ctx.drop || 'N/A'}`,
      `🚗 Vehicle: ${ctx.vehicleName || ctx.vehicleCategory || 'N/A'}`,
      `💰 Estimated Fare: ₹${ctx.estimatedFare || 0}`,
      '',
      'Reply *yes* to confirm or *no* to cancel.',
    ].join('\n');
    return this._send(phone, msg);
  }

  async sendBookingConfirmation(phone, booking) {
    const msg = [
      '✅ *Booking Confirmed!*',
      `🔖 Booking No: ${booking.bookingNumber}`,
      `📍 From: ${booking.pickup}`,
      `🏁 To: ${booking.drop}`,
      `🚗 Vehicle: ${booking.vehicleType}`,
      `💰 Fare: ₹${booking.estimatedFare}`,
      `🔐 OTP: ${booking.rideOtp}`,
      '',
      'Show OTP to the driver before starting the ride.',
      '',
      'Type *track* to track your ride.',
    ].join('\n');
    return this._send(phone, msg);
  }

  async sendVehicleList(phone, vehicles) {
    const lines = ['🚗 *Select Vehicle Type*', ''];
    vehicles.forEach((v, i) => {
      lines.push(`${i + 1}. ${v.emoji || ''} ${v.name} — ₹${v.pricePerKm}/km (Base ₹${v.baseFare})`);
    });
    lines.push('', 'Reply with the vehicle number or name.');
    return this._send(phone, lines.join('\n'));
  }

  async sendError(phone, message) {
    return this._send(phone, `⚠️ ${message}`);
  }

  async sendSOS(phone) {
    return this._send(phone, '🆘 *SOS Alert Received!*\nOur support team has been notified. Help is on the way.\n\nEmergency: 112');
  }
}

module.exports = new WhatsAppService();
