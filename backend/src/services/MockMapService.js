'use strict';

/**
 * MockMapService
 * Placeholder for Google Maps integration.
 * All methods return hardcoded mock data.
 * Replace with real Google Maps Distance Matrix / Geocoding API in future.
 */
class MockMapService {
  /**
   * @returns {{ distance: number, duration: number, unit: string }}
   */
  estimateDistance(pickup, drop) {
    // Fixed mock — will be replaced by real directions API
    return { distance: 12, duration: 25, unit: 'km' };
  }

  /**
   * @returns {{ lat: number, lng: number, formatted: string }}
   */
  geocode(address) {
    return { lat: 0, lng: 0, formatted: address };
  }
}

module.exports = new MockMapService();
