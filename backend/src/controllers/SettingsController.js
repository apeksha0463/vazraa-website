'use strict';

const { successResponse } = require('../utils/response');

class SettingsController {
  /**
   * GET /api/settings
   */
  getSettings(req, res) {
    return successResponse(res, {
      appName:    'Vazraa Mobility',
      version:    '1.0.0',
      supportedVehicleTypes: ['car', 'bike', 'bus', 'commercial', 'van', 'ev'],
      bookingSources: ['Website', 'WhatsApp'],
      currency:   'INR',
      mockMode: {
        maps:    true,
        payment: true,
        tracking: true,
      },
    }, 'Settings retrieved');
  }
}

module.exports = new SettingsController();
