'use strict';

const chatSessionRepo = require('../repositories/ChatSessionRepository');
const { CHAT_STATE } = require('../constants');

class ChatSessionService {
  async getOrCreateSession(phone, userName) {
    let session = await chatSessionRepo.findByPhone(phone);
    if (!session) {
      session = await chatSessionRepo.upsert(phone, {
        phone,
        userName,
        currentState: CHAT_STATE.MENU,
        bookingContext: {},
        lastMessage: '',
      });
    }
    return session;
  }

  async getSession(phone) {
    return chatSessionRepo.findByPhone(phone);
  }

  async updateState(phone, newState, contextUpdates = {}) {
    return chatSessionRepo.updateState(phone, newState, contextUpdates);
  }

  async updateLastMessage(phone, message) {
    return chatSessionRepo.upsert(phone, { lastMessage: message });
  }

  async resetSession(phone) {
    return chatSessionRepo.resetSession(phone);
  }

  async deleteSession(phone) {
    return chatSessionRepo.deleteByPhone(phone);
  }

  /**
   * Update the booking context incrementally during chatbot flow.
   */
  async setBookingContext(phone, contextUpdates) {
    return chatSessionRepo.updateState(phone, null, contextUpdates);
  }
}

module.exports = new ChatSessionService();
