'use strict';

/**
 * Send a standardised success response.
 * @param {import('express').Response} res
 * @param {*} data
 * @param {string} message
 * @param {number} statusCode
 */
function successResponse(res, data = {}, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data });
}

/**
 * Send a standardised error response.
 * @param {import('express').Response} res
 * @param {string} message
 * @param {string} errorCode
 * @param {number} statusCode
 */
function errorResponse(res, message = 'An error occurred', errorCode = 'INTERNAL_ERROR', statusCode = 400) {
  return res.status(statusCode).json({ success: false, message, errorCode });
}

module.exports = { successResponse, errorResponse };
