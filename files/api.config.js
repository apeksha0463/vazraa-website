/**
 * api.config.js
 * Shared API base URL for all frontend pages.
 * Change BASE_URL here to point to production when deploying.
 */
const API_CONFIG = {
  // Dev (localhost or file://): backend runs on :5000
  // Production (nginx): frontend and backend share the same origin, /api/* is proxied
  BASE_URL: (window.location.protocol === 'file:' || window.location.hostname === 'localhost')
    ? 'http://localhost:5000'
    : window.location.origin,
};

// Make available globally
window.API_CONFIG = API_CONFIG;
