'use strict';

const { body } = require('express-validator');

// ─── Customer Registration ─────────────────────────────────────────────────────
const registerCustomerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),

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
];

// ─── Customer Login ────────────────────────────────────────────────────────────
const loginCustomerRules = [
  body('identifier')
    .trim()
    .notEmpty().withMessage('Email or phone number is required'),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

// ─── Driver Login ──────────────────────────────────────────────────────────────
const loginDriverRules = [
  body('identifier')
    .trim()
    .notEmpty().withMessage('Email or phone number is required'),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

// ─── Admin Login ───────────────────────────────────────────────────────────────
const loginAdminRules = [
  body('identifier')
    .trim()
    .notEmpty().withMessage('Email or phone number is required'),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

module.exports = {
  registerCustomerRules,
  loginCustomerRules,
  loginDriverRules,
  loginAdminRules,
};
