'use strict';

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipientType: {
      type: String,
      enum: ['customer', 'driver', 'admin'],
      required: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    message:  { type: String, required: true },
    channel:  { type: String, enum: ['whatsapp', 'sms', 'email', 'push'], default: 'whatsapp' },
    status:   { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);

// Placeholder — v1 does not actively send notifications
module.exports = mongoose.model('Notification', notificationSchema);
