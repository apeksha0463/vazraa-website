'use strict';

const mongoose = require('mongoose');
const { BOOKING_STATUS, PAYMENT_STATUS, BOOKING_SOURCE } = require('../constants');

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,
    },
    vehicleType:  { type: String, required: true, trim: true },
    vehicleCategory: { type: String, trim: true },  // e.g. 'car', 'bike'

    // Trip details
    pickup:           { type: String, required: true },
    drop:             { type: String, required: true },
    scheduledDate:    { type: String },   // ISO date string
    scheduledTime:    { type: String },   // HH:MM
    passengers:       { type: String, default: '1 Passenger' },

    // Location coordinates (WhatsApp location pin / future Google Maps)
    pickupCoords: {
      lat: { type: Number },
      lng: { type: Number },
    },
    dropCoords: {
      lat: { type: Number },
      lng: { type: Number },
    },

    // Fare
    estimatedDistance: { type: Number, default: 12 },  // km (mock)
    estimatedFare:     { type: Number, default: 0 },

    // Statuses
    bookingStatus: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
    bookingSource: {
      type: String,
      enum: Object.values(BOOKING_SOURCE),
      default: BOOKING_SOURCE.WEBSITE,
    },

    // Ride OTP (mock – 4 digits stored as string)
    rideOtp: { type: String },

    // Cancellation
    cancelledBy:  { type: String },   // 'customer' | 'driver' | 'admin'
    cancelReason: { type: String },
  },
  {
    timestamps: true,
  },
);

bookingSchema.index({ customerId: 1 });
bookingSchema.index({ driverId: 1 });
bookingSchema.index({ bookingStatus: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
