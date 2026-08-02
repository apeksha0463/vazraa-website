'use strict';

const { validationResult } = require('express-validator');
const { errorResponse }    = require('../utils/response');
const { ERROR_CODES }      = require('../constants');

/**
 * Middleware to run after express-validator rules.
 * Returns 400 with the first validation error if any exist.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const first = errors.array()[0];
    return errorResponse(res, first.msg, ERROR_CODES.VALIDATION_ERROR, 400);
  }
  return next();
}

module.exports = validate;
