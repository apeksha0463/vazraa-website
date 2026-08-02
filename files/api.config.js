/**
 * api.config.js
 * Shared API base URL for all frontend pages.
 * Change BASE_URL here to point to production when deploying.
 */
const API_CONFIG = {
  BASE_URL: (window.location.protocol === 'file:') ? 'http://localhost:5000' : window.location.origin,
};

// Make available globally
window.API_CONFIG = API_CONFIG;
