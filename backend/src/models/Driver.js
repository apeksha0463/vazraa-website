'use strict';

const mongoose = require('mongoose');
const { DRIVER_STATUS } = require('../constants');

const driverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      unique: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    city: { type: String, trim: true },
    address: { type: String, trim: true },

    // Vehicle
    vehicleType:  { type: String, trim: true },
    vehicleModel: { type: String, trim: true },
    vehicleRegNo: { type: String, trim: true },
    vehicleYear:  { type: Number },

    // Documents (filenames / URLs — stored as strings for v1)
    licenseDoc:   { type: String },
    rcDoc:        { type: String },
    insuranceDoc: { type: String },
    photoDoc:     { type: String },

    status: {
      type: String,
      enum: Object.values(DRIVER_STATUS),
      default: DRIVER_STATUS.OFFLINE,
    },
    isVerified: { type: Boolean, default: false },
    isActive:   { type: Boolean, default: true },

    currentBookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    rating:     { type: Number, default: 5.0, min: 0, max: 5 },
    totalRides: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_, ret) {
        delete ret.passwordHash;
        return ret;
      },
    },
  },
);

// phone and email indexes auto-created by unique:true above
driverSchema.index({ status: 1 });

module.exports = mongoose.model('Driver', driverSchema);
