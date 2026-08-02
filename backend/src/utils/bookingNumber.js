'use strict';

/**
 * Generates a unique booking number in the format BK + 6 digits.
 * Example: BK482931
 */
function generateBookingNumber() {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `BK${digits}`;
}

module.exports = { generateBookingNumber };
