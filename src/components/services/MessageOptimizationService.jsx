/**
 * Message Optimization Service
 * Optimizes message loading, caching, and delivery
 */

class MessageOptimizationService {
  constructor() {
    this.messageCache = new Map();
    this.conversationCache = new Map();
    this.deliveryQueue = [];
    this.isProcessing = false;
  }

  /**
   * Cache messages
   */
  cacheMessages(conversationId, messages) {
    this.messageCache.set(conversationId, {
      messages,
      timestamp: Date.now()
    });
  }

  /**
   * Get cached messages
   */
  getCachedMessages(conversationId) {
    const cached = this.messageCache.get(conversationId);
    
    if (!cached) return null;

    // Cache valid for 1 minute
    if (Date.now() - cached.timestamp > 60000) {
      this.messageCache.delete(conversationId);
      return null;
    }

    return cached.messages;
  }

  /**
   * Cache conversation
   */
  cacheConversation(conversation) {
    this.conversationCache.set(conversation.id, {
      conversation,
      timestamp: Date.now()
    });
  }

  /**
   * Get cached conversation
   */
  getCachedConversation(conversationId) {
    const cached = this.conversationCache.get(conversationId);
    
    if (!cached) return null;

    // Cache valid for 5 minutes
    if (Date.now() - cached.timestamp > 300000) {
      this.conversationCache.delete(conversationId);
      return null;
    }

    return cached.conversation;
  }

  /**
   * Queue message for delivery
   */
  queueMessage(message) {
    this.deliveryQueue.push({
      ...message,
      timestamp: Date.now(),
      attempts: 0
    });

    this.processQueue();
  }

  /**
   * Process delivery queue
   */
  async processQueue() {
    if (this.isProcessing || this.deliveryQueue.length === 0) return;

    this.isProcessing = true;

    while (this.deliveryQueue.length > 0) {
      const message = this.deliveryQueue[0];

      try {
        await this.deliverMessage(message);
        this.deliveryQueue.shift();
      } catch (error) {
        message.attempts++;

        if (message.attempts >= 3) {
          // Failed after 3 attempts
          this.deliveryQueue.shift();
          this.notifyDeliveryFailure(message);
        } else {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * message.attempts));
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * Deliver message
   */
  async deliverMessage(message) {
    // This will be implemented by the actual message sending logic
    const event = new CustomEvent('deliver-message', { detail: message });
    window.dispatchEvent(event);
  }

  /**
   * Notify delivery failure
   */
  notifyDeliveryFailure(message) {
    const event = new CustomEvent('message-delivery-failed', { detail: message });
    window.dispatchEvent(event);
  }

  /**
   * Optimize message list
   */
  optimizeMessageList(messages, windowSize = 50) {
    // Only render messages in current window
    if (messages.length <= windowSize) return messages;

    const startIndex = Math.max(0, messages.length - windowSize);
    return messages.slice(startIndex);
  }

  /**
   * Group messages by date
   */
  groupMessagesByDate(messages) {
    const groups = [];
    let currentDate = null;
    let currentGroup = [];

    messages.forEach(message => {
      const messageDate = new Date(message.created_date).toDateString();

      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.messageCache.clear();
    this.conversationCache.clear();
  }
}

export default new MessageOptimizationService();