'use strict';

const { GLOBAL_COMMANDS } = require('../constants');

/**
 * WebhookParserService
 * Single responsibility: parse AI Sensy raw payload into a normalised object.
 * No business logic here.
 */
class WebhookParserService {
  /**
   * Parse incoming AI Sensy webhook payload.
   * @param {object} body - raw request body
   * @returns {{ phone, userName, messageType, text, location, timestamp, topic, messageId }}
   */
  parse(body) {
    const topic = body.topic || '';
    const data  = body.data  || {};

    const phone      = data.from       || '';
    const userName   = data.userName   || '';
    const timestamp  = data.timestamp  || Date.now();
    const messageId  = data.id         || '';
    const msg        = data.message    || {};

    const messageType = msg.type || 'unknown';
    const text        = messageType === 'text' && msg.text ? msg.text.trim().toLowerCase() : '';
    const location    = messageType === 'location' ? msg.location : null;

    return { phone, userName, messageType, text, location, timestamp, topic, messageId };
  }

  /**
   * Check whether the text matches a global command.
   */
  isGlobalCommand(text) {
    if (!text) return false;
    const normalized = text.trim().toLowerCase();
    return GLOBAL_COMMANDS.some(cmd => normalized === cmd || normalized.startsWith(cmd + ' '));
  }

  /**
   * Extract the root global command from the text.
   */
  getGlobalCommand(text) {
    if (!text) return null;
    const normalized = text.trim().toLowerCase();
    return GLOBAL_COMMANDS.find(cmd => normalized === cmd || normalized.startsWith(cmd + ' ')) || null;
  }

  /**
   * Check if event is a status update (not a user message).
   */
  isStatusUpdate(topic) {
    return topic === 'message.status.updated';
  }
}

module.exports = new WebhookParserService();
