'use strict';

const ChatSession = require('../models/ChatSession');
const { CHAT_STATE } = require('../constants');

const SESSION_TIMEOUT_MS = (parseInt(process.env.SESSION_TIMEOUT_MINUTES, 10) || 30) * 60 * 1000;

class ChatSessionRepository {
  async findByPhone(phone) {
    return ChatSession.findOne({ phone });
  }

  async upsert(phone, data) {
    const expiresAt = new Date(Date.now() + SESSION_TIMEOUT_MS);
    return ChatSession.findOneAndUpdate(
      { phone },
      { $set: { ...data, expiresAt, lastActivity: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  async updateState(phone, newState, contextUpdates = {}) {
    const expiresAt = new Date(Date.now() + SESSION_TIMEOUT_MS);
    const update = {
      currentState: newState,
      lastActivity: new Date(),
      expiresAt,
    };
    if (Object.keys(contextUpdates).length > 0) {
      Object.keys(contextUpdates).forEach((key) => {
        update[`bookingContext.${key}`] = contextUpdates[key];
      });
    }
    return ChatSession.findOneAndUpdate({ phone }, { $set: update }, { new: true });
  }

  async resetSession(phone) {
    const expiresAt = new Date(Date.now() + SESSION_TIMEOUT_MS);
    return ChatSession.findOneAndUpdate(
      { phone },
      {
        $set: {
          currentState: CHAT_STATE.MENU,
          bookingContext: {},
          lastActivity: new Date(),
          expiresAt,
        },
      },
      { new: true },
    );
  }

  async deleteByPhone(phone) {
    return ChatSession.deleteOne({ phone });
  }
}

module.exports = new ChatSessionRepository();
