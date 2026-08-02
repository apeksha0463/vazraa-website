'use strict';

const { body } = require('express-validator');

const createBookingRules = [
  body('pickup')
    .trim()
    .notEmpty().withMessage('Pickup location is required'),

  body('drop')
    .trim()
    .notEmpty().withMessage('Drop location is required'),

  body('vehicleType')
    .trim()
    .notEmpty().withMessage('Vehicle type is required'),
];

const cancelBookingRules = [
  body('bookingId')
    .trim()
    .notEmpty().withMessage('bookingId is required'),
];

module.exports = { createBookingRules, cancelBookingRules };
