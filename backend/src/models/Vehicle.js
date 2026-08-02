'use strict';

const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    pricePerKm: {
      type: Number,
      required: true,
      min: 0,
    },
    baseFare: {
      type: Number,
      required: true,
      min: 0,
    },
    platformFee: {
      type: Number,
      required: true,
      min: 0,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    description: { type: String },
    imageUrl:    { type: String },
    emoji:       { type: String },          // display emoji (e.g. 🚗)
  },
  { timestamps: true },
);

vehicleSchema.index({ category: 1 });
vehicleSchema.index({ isAvailable: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);
