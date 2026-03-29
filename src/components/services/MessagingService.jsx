import { base44 } from '@/api/base44Client';

class MessagingService {
  constructor() {
    this.subscribers = new Map();
    this.pollingInterval = null;
    this.lastFetch = null;
    this.userEmail = null;
    this.isPolling = false;
    this.errorCount = 0;
    this.maxErrors = 3;
  }

  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event).add(callback);

    return () => {
      const callbacks = this.subscribers.get(event);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  emit(event, data) {
    const callbacks = this.subscribers.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          // Silent error handling
        }
      });
    }
  }

  async triggerCheck(userEmail) {
    if (!userEmail) return;
    
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        this.stopPolling();
        return;
      }

      const now = new Date().toISOString();
      const rawMessages = await base44.entities.Message.filter(
        this.lastFetch 
          ? { created_date: { $gte: this.lastFetch } }
          : {},
        '-created_date',
        50
      );

      const messages = (rawMessages || []).map(msg => {
        if (!msg) return null;
        if (msg.data && typeof msg.data === 'object') {
          return {
            ...msg.data,
            id: msg.id,
            created_date: msg.created_date,
            created_by: msg.created_by
          };
        }
        return msg;
      }).filter(Boolean);

      if (messages && messages.length > 0) {
        this.emit('messages:new', messages);
        this.emit('messages:notification', { messages, count: messages.length });
        this.emit('conversations:update', messages);
      }

      this.lastFetch = now;
      this.errorCount = 0;
    } catch (error) {
      this.errorCount++;
      
      if (this.errorCount >= this.maxErrors) {
        this.stopPolling();
      }
    }
  }

  async startPolling(userEmail) {
    if (this.isPolling) {
      return;
    }

    this.userEmail = userEmail;
    this.isPolling = true;
    this.errorCount = 0;

    const poll = async () => {
      if (!this.isPolling) return;
      await this.triggerCheck(userEmail);
    };

    await poll();
    this.pollingInterval = setInterval(poll, 5000);
  }

  stopPolling() {
    this.isPolling = false;
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.errorCount = 0;
  }
}

const messagingService = new MessagingService();
export default messagingService;