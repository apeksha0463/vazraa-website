'use strict';

const mongoose = require('mongoose');
const { CHAT_STATE } = require('../constants');

const chatSessionSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    userName: { type: String, trim: true },

    currentState: {
      type: String,
      enum: Object.values(CHAT_STATE),
      default: CHAT_STATE.MENU,
    },

    // Temporary booking data accumulated during chatbot flow
    bookingContext: {
      pickup:          { type: String },
      pickupLat:       { type: Number },
      pickupLng:       { type: Number },
      drop:            { type: String },
      dropLat:         { type: Number },
      dropLng:         { type: Number },
      vehicleCategory: { type: String },
      vehicleName:     { type: String },
      estimatedFare:   { type: Number },
      customerId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },

    lastMessage:  { type: String },
    lastActivity: { type: Date, default: Date.now },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 60 * 1000),  // 30 min from now
    },
  },
  {
    timestamps: true,
  },
);

// TTL index — MongoDB auto-deletes expired sessions
chatSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
