'use strict';

const { body } = require('express-validator');

const registerDriverRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),

  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit Indian mobile number'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),

  body('vehicleType')
    .trim()
    .notEmpty().withMessage('Vehicle type is required'),

  body('vehicleModel')
    .trim()
    .notEmpty().withMessage('Vehicle model is required'),

  body('vehicleRegNo')
    .trim()
    .notEmpty().withMessage('Vehicle registration number is required'),
];

const updateAvailabilityRules = [
  body('status')
    .trim()
    .notEmpty().withMessage('Status is required')
    .isIn(['Available', 'Offline', 'Busy']).withMessage('Invalid status value'),
];

module.exports = { registerDriverRules, updateAvailabilityRules };
