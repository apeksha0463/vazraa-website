'use strict';

// ─── Booking Statuses ─────────────────────────────────────────────────────────
const BOOKING_STATUS = Object.freeze({
  PENDING:           'Pending',
  DRIVER_ASSIGNED:   'Driver Assigned',
  DRIVER_ACCEPTED:   'Driver Accepted',
  DRIVER_EN_ROUTE:   'Driver En Route',
  RIDE_STARTED:      'Ride Started',
  RIDE_COMPLETED:    'Ride Completed',
  CANCELLED:         'Cancelled',
});

// ─── Payment Statuses ─────────────────────────────────────────────────────────
const PAYMENT_STATUS = Object.freeze({
  PENDING:  'Pending',
  PAID:     'Paid',
  FAILED:   'Failed',
  REFUNDED: 'Refunded',
});

// ─── Driver Statuses ──────────────────────────────────────────────────────────
const DRIVER_STATUS = Object.freeze({
  AVAILABLE:  'Available',
  BUSY:       'Busy',
  OFFLINE:    'Offline',
  SUSPENDED:  'Suspended',
});

// ─── Booking Sources ──────────────────────────────────────────────────────────
const BOOKING_SOURCE = Object.freeze({
  WEBSITE:   'Website',
  WHATSAPP:  'WhatsApp',
});

// ─── User Roles ───────────────────────────────────────────────────────────────
const ROLES = Object.freeze({
  CUSTOMER: 'customer',
  DRIVER:   'driver',
  ADMIN:    'admin',
});

// ─── Chatbot States ───────────────────────────────────────────────────────────
const CHAT_STATE = Object.freeze({
  MENU:                       'MENU',
  AWAITING_PICKUP:            'AWAITING_PICKUP',
  AWAITING_DROP:              'AWAITING_DROP',
  AWAITING_VEHICLE_SELECTION: 'AWAITING_VEHICLE_SELECTION',
  AWAITING_CONFIRMATION:      'AWAITING_CONFIRMATION',
  RIDE_ACTIVE:                'RIDE_ACTIVE',
  // Driver states
  DRIVER_MENU:                'DRIVER_MENU',
});

// ─── Global Chatbot Commands ──────────────────────────────────────────────────
const GLOBAL_COMMANDS = Object.freeze(['hi', 'hello', 'menu', 'start', 'track', 'cancel', 'fare', 'sos']);

// ─── Vehicle Categories (matching frontend HTML) ──────────────────────────────
const VEHICLE_CATEGORIES = Object.freeze({
  CAR:        'car',
  BIKE:       'bike',
  BUS:        'bus',
  COMMERCIAL: 'commercial',
  VAN:        'van',
  EV:         'ev',
});

// ─── Error Codes ──────────────────────────────────────────────────────────────
const ERROR_CODES = Object.freeze({
  VALIDATION_ERROR:       'VALIDATION_ERROR',
  INVALID_CREDENTIALS:    'INVALID_LOGIN',
  UNAUTHORIZED:           'UNAUTHORIZED',
  FORBIDDEN:              'FORBIDDEN',
  NOT_FOUND:              'NOT_FOUND',
  DUPLICATE_EMAIL:        'DUPLICATE_EMAIL',
  DUPLICATE_PHONE:        'DUPLICATE_PHONE',
  ACTIVE_BOOKING_EXISTS:  'ACTIVE_BOOKING_EXISTS',
  VEHICLE_UNAVAILABLE:    'VEHICLE_UNAVAILABLE',
  BOOKING_NOT_FOUND:      'BOOKING_NOT_FOUND',
  CANNOT_CANCEL:          'CANNOT_CANCEL',
  DRIVER_BUSY:            'DRIVER_BUSY',
  INTERNAL_ERROR:         'INTERNAL_ERROR',
  INVALID_OTP:            'INVALID_OTP',
});

module.exports = {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  DRIVER_STATUS,
  BOOKING_SOURCE,
  ROLES,
  CHAT_STATE,
  GLOBAL_COMMANDS,
  VEHICLE_CATEGORIES,
  ERROR_CODES,
};
