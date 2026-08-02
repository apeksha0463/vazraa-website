'use strict';

const webhookParser     = require('../services/WebhookParserService');
const chatSessionService = require('../services/ChatSessionService');
const bookingService    = require('../services/BookingService');
const vehicleService    = require('../services/VehicleService');
const whatsappService   = require('../services/WhatsAppService');
const userRepo          = require('../repositories/UserRepository');
const bookingRepo       = require('../repositories/BookingRepository');
const logger            = require('../utils/logger');
const { CHAT_STATE, BOOKING_SOURCE } = require('../constants');

class WebhookController {
  /**
   * POST /api/webhooks/aisensy
   * Must always return HTTP 200 to prevent AI Sensy from retrying.
   */
  async handleWebhook(req, res) {
    // Acknowledge immediately
    res.status(200).json({ success: true, message: 'Webhook received' });

    // Process asynchronously to avoid blocking
    setImmediate(() => this._process(req.body).catch(err => {
      logger.error('[Webhook] Processing error', { error: err.message });
    }));
  }

  async _process(body) {
    const parsed = webhookParser.parse(body);
    const { phone, userName, messageType, text, location, topic } = parsed;

    logger.info('[Webhook] Received', { phone, topic, messageType, text });

    // Status updates — log only, do not affect chatbot state
    if (webhookParser.isStatusUpdate(topic)) {
      logger.info('[Webhook] Status update', { phone, text });
      return;
    }

    if (!phone) {
      logger.warn('[Webhook] No phone number in payload');
      return;
    }

    // Get or create session
    const session = await chatSessionService.getOrCreateSession(phone, userName);
    const state   = session.currentState;

    // ─── Global Commands (override state) ──────────────────────────────────────
    if (webhookParser.isGlobalCommand(text)) {
      await this._handleGlobalCommand(phone, text, session);
      return;
    }

    // ─── Location Message ───────────────────────────────────────────────────────
    if (messageType === 'location' && location) {
      await this._handleLocation(phone, location, state);
      return;
    }

    // ─── State Machine ──────────────────────────────────────────────────────────
    switch (state) {
      case CHAT_STATE.MENU:
        await this._handleMenu(phone, text);
        break;

      case CHAT_STATE.AWAITING_PICKUP:
        await this._handlePickup(phone, text, session);
        break;

      case CHAT_STATE.AWAITING_DROP:
        await this._handleDrop(phone, text, session);
        break;

      case CHAT_STATE.AWAITING_VEHICLE_SELECTION:
        await this._handleVehicleSelection(phone, text, session);
        break;

      case CHAT_STATE.AWAITING_CONFIRMATION:
        await this._handleConfirmation(phone, text, session);
        break;

      case CHAT_STATE.RIDE_ACTIVE:
        await this._handleRideActive(phone, text, session);
        break;

      default:
        await chatSessionService.resetSession(phone);
        await whatsappService.sendMenu(phone);
    }
  }

  // ─── Global Command Handler ─────────────────────────────────────────────────
  async _handleGlobalCommand(phone, text, session) {
    const cmd = webhookParser.getGlobalCommand(text);

    switch (cmd) {
      case 'hi':
      case 'hello':
      case 'menu':
      case 'start':
        await chatSessionService.resetSession(phone);
        await whatsappService.sendMenu(phone);
        break;

      case 'track': {
        const activeBooking = session.bookingContext?.lastBookingId
          ? await bookingRepo.findById(session.bookingContext.lastBookingId)
          : null;

        if (activeBooking) {
          const tracking = await bookingService.trackBooking(activeBooking._id.toString());
          await whatsappService.sendMessage(phone,
            `📍 *Ride Status*\n` +
            `Booking: ${tracking.bookingNumber}\n` +
            `Status: ${tracking.bookingStatus}\n` +
            `From: ${tracking.pickup}\n` +
            `To: ${tracking.drop}\n` +
            `ETA: ${tracking.etaMinutes} mins (mock)`,
          );
        } else {
          await whatsappService.sendMessage(phone, '❌ No active booking found. Type *book* to book a ride.');
        }
        break;
      }

      case 'cancel': {
        const activeBooking = session.bookingContext?.lastBookingId
          ? await bookingRepo.findById(session.bookingContext.lastBookingId)
          : null;

        if (activeBooking) {
          await bookingService.cancelBooking(activeBooking._id.toString(), 'customer', 'Cancelled via WhatsApp');
          await chatSessionService.resetSession(phone);
          await whatsappService.sendMessage(phone, '✅ Your booking has been cancelled. Type *menu* for options.');
        } else {
          await whatsappService.sendMessage(phone, '❌ No active booking to cancel.');
        }
        break;
      }

      case 'fare':
        await chatSessionService.resetSession(phone);
        await chatSessionService.updateState(phone, CHAT_STATE.AWAITING_PICKUP);
        await whatsappService.sendMessage(phone, '📍 Enter your *pickup location* to estimate the fare:');
        break;

      case 'sos':
        await whatsappService.sendSOS(phone);
        logger.warn('[Webhook] SOS triggered', { phone });
        break;

      default:
        await whatsappService.sendMenu(phone);
    }
  }

  // ─── MENU state ─────────────────────────────────────────────────────────────
  async _handleMenu(phone, text) {
    if (text === 'book' || text === '1') {
      await chatSessionService.updateState(phone, CHAT_STATE.AWAITING_PICKUP);
      await whatsappService.sendMessage(phone, '📍 Please enter your *pickup location*:');
    } else {
      await whatsappService.sendMenu(phone);
    }
  }

  // ─── AWAITING_PICKUP state ────────────────────────────────────────────────
  async _handlePickup(phone, text, session) {
    if (!text || text.length < 2) {
      await whatsappService.sendMessage(phone, '⚠️ Please enter a valid pickup location.');
      return;
    }
    await chatSessionService.updateState(phone, CHAT_STATE.AWAITING_DROP, { pickup: text });
    await whatsappService.sendMessage(phone, `✅ Pickup: *${text}*\n\n🏁 Now enter your *drop location*:`);
  }

  // ─── AWAITING_DROP state ──────────────────────────────────────────────────
  async _handleDrop(phone, text, session) {
    if (!text || text.length < 2) {
      await whatsappService.sendMessage(phone, '⚠️ Please enter a valid drop location.');
      return;
    }
    await chatSessionService.updateState(phone, CHAT_STATE.AWAITING_VEHICLE_SELECTION, { drop: text });

    const vehicles = await vehicleService.getAllVehicles(true);
    await whatsappService.sendVehicleList(phone, vehicles);
    await chatSessionService.updateState(phone, CHAT_STATE.AWAITING_VEHICLE_SELECTION);
  }

  // ─── AWAITING_VEHICLE_SELECTION state ─────────────────────────────────────
  async _handleVehicleSelection(phone, text, session) {
    const vehicles = await vehicleService.getAllVehicles(true);

    // Match by number (1-6) or partial name/category
    let selected = null;
    const num = parseInt(text, 10);
    if (!isNaN(num) && num >= 1 && num <= vehicles.length) {
      selected = vehicles[num - 1];
    } else {
      selected = vehicles.find(v =>
        v.name.toLowerCase().includes(text) ||
        v.category.toLowerCase().includes(text),
      );
    }

    if (!selected) {
      await whatsappService.sendMessage(phone, '⚠️ Invalid selection. Please reply with a number or vehicle name.');
      await whatsappService.sendVehicleList(phone, vehicles);
      return;
    }

    const fare = vehicleService.calculateFare(selected);
    await chatSessionService.updateState(phone, CHAT_STATE.AWAITING_CONFIRMATION, {
      vehicleCategory: selected.category,
      vehicleName:     selected.name,
      estimatedFare:   fare,
    });

    // Refresh session for summary
    const updatedSession = await chatSessionService.getSession(phone);
    await whatsappService.sendBookingSummary(phone, updatedSession.bookingContext);
  }

  // ─── AWAITING_CONFIRMATION state ──────────────────────────────────────────
  async _handleConfirmation(phone, text, session) {
    const ctx = session.bookingContext || {};

    if (text === 'yes' || text === 'y' || text === 'confirm') {
      // Lookup customer by phone
      let customer = await userRepo.findByPhone(phone.replace(/^91/, ''));
      if (!customer) customer = await userRepo.findByPhone(phone);

      if (!customer) {
        await whatsappService.sendMessage(
          phone,
          '⚠️ You need to register first. Visit our website to create an account.',
        );
        await chatSessionService.resetSession(phone);
        return;
      }

      try {
        const booking = await bookingService.createBooking({
          customerId:     customer._id,
          vehicleType:    ctx.vehicleName    || ctx.vehicleCategory,
          vehicleCategory: ctx.vehicleCategory,
          pickup:         ctx.pickup,
          drop:           ctx.drop,
          bookingSource:  BOOKING_SOURCE.WHATSAPP,
        });

        // Store booking id in context for track/cancel
        await chatSessionService.updateState(phone, CHAT_STATE.RIDE_ACTIVE, {
          lastBookingId: booking._id.toString(),
        });

        await whatsappService.sendBookingConfirmation(phone, booking);
      } catch (err) {
        logger.error('[Webhook] Booking creation failed', { phone, error: err.message });
        await whatsappService.sendError(phone, err.message);
        await chatSessionService.resetSession(phone);
      }
    } else if (text === 'no' || text === 'n' || text === 'cancel') {
      await chatSessionService.resetSession(phone);
      await whatsappService.sendMessage(phone, '❌ Booking cancelled. Type *menu* to start again.');
    } else {
      await whatsappService.sendMessage(phone, 'Reply *yes* to confirm or *no* to cancel.');
    }
  }

  // ─── RIDE_ACTIVE state ─────────────────────────────────────────────────────
  async _handleRideActive(phone, text, session) {
    await whatsappService.sendMessage(
      phone,
      '🚗 Your ride is active!\n\nType *track* to track | *cancel* to cancel | *menu* for options.',
    );
  }

  // ─── Location handling ─────────────────────────────────────────────────────
  async _handleLocation(phone, location, state) {
    const { latitude, longitude } = location;
    const locationText = `${latitude},${longitude}`;

    if (state === CHAT_STATE.AWAITING_PICKUP) {
      await chatSessionService.updateState(phone, CHAT_STATE.AWAITING_DROP, {
        pickup:    locationText,
        pickupLat: latitude,
        pickupLng: longitude,
      });
      await whatsappService.sendMessage(
        phone,
        `📍 Pickup location received (${latitude}, ${longitude})\n\n🏁 Now enter your *drop location*:`,
      );
    } else if (state === CHAT_STATE.AWAITING_DROP) {
      await chatSessionService.updateState(phone, CHAT_STATE.AWAITING_VEHICLE_SELECTION, {
        drop:    locationText,
        dropLat: latitude,
        dropLng: longitude,
      });
      const vehicles = await vehicleService.getAllVehicles(true);
      await whatsappService.sendVehicleList(phone, vehicles);
    } else {
      await whatsappService.sendMessage(phone, '📍 Location received. Type *menu* for options.');
    }
  }
}

module.exports = new WebhookController();
