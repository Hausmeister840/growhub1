/**
 * Message Realtime Service
 * Handles real-time message updates and typing indicators
 */

class MessageRealtimeService {
  constructor() {
    this.listeners = new Map();
    this.typingUsers = new Map();
    this.pollInterval = null;
    this.pollDelay = 3000;
  }

  /**
   * Start polling for new messages
   */
  startPolling(conversationId, callback) {
    if (this.pollInterval) {
      this.stopPolling();
    }

    const listener = {
      conversationId,
      callback,
      lastCheck: Date.now()
    };

    this.listeners.set(conversationId, listener);

    this.pollInterval = setInterval(() => {
      this.checkForUpdates();
    }, this.pollDelay);

    // Check immediately
    this.checkForUpdates();
  }

  /**
   * Stop polling
   */
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.listeners.clear();
  }

  /**
   * Check for updates
   */
  async checkForUpdates() {
    for (const [conversationId, listener] of this.listeners) {
      try {
        const event = new CustomEvent('check-messages', {
          detail: {
            conversationId,
            since: listener.lastCheck
          }
        });
        window.dispatchEvent(event);

        listener.lastCheck = Date.now();
      } catch (error) {
        console.error('Error checking messages:', error);
      }
    }
  }

  /**
   * Add typing indicator
   */
  setTyping(conversationId, userId, isTyping) {
    if (!this.typingUsers.has(conversationId)) {
      this.typingUsers.set(conversationId, new Set());
    }

    const users = this.typingUsers.get(conversationId);

    if (isTyping) {
      users.add(userId);
    } else {
      users.delete(userId);
    }

    this.notifyTypingChange(conversationId);
  }

  /**
   * Get typing users
   */
  getTypingUsers(conversationId) {
    return Array.from(this.typingUsers.get(conversationId) || []);
  }

  /**
   * Notify typing change
   */
  notifyTypingChange(conversationId) {
    const event = new CustomEvent('typing-change', {
      detail: {
        conversationId,
        users: this.getTypingUsers(conversationId)
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * Clear typing timeout
   */
  clearTypingTimeout(conversationId, userId) {
    setTimeout(() => {
      this.setTyping(conversationId, userId, false);
    }, 3000);
  }
}

export default new MessageRealtimeService();