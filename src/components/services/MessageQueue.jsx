// Message Queue Service for offline support and retry logic
class MessageQueueService {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.retryAttempts = new Map();
    this.maxRetries = 3;
  }

  async addMessage(message, sendFn) {
    const queueItem = {
      id: message.id,
      message,
      sendFn,
      timestamp: Date.now(),
      status: 'pending'
    };

    this.queue.push(queueItem);
    this.processQueue();
    
    return queueItem;
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue[0];
      
      try {
        await item.sendFn();
        this.queue.shift();
        this.retryAttempts.delete(item.id);
      } catch (error) {
        const attempts = (this.retryAttempts.get(item.id) || 0) + 1;
        this.retryAttempts.set(item.id, attempts);

        if (attempts >= this.maxRetries) {
          item.status = 'failed';
          this.queue.shift();
          this.retryAttempts.delete(item.id);
        } else {
          // Exponential backoff: 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)));
        }
      }
    }

    this.processing = false;
  }

  getQueueStatus() {
    return {
      pending: this.queue.length,
      items: this.queue.map(item => ({
        id: item.id,
        status: item.status,
        attempts: this.retryAttempts.get(item.id) || 0
      }))
    };
  }

  clearQueue() {
    this.queue = [];
    this.retryAttempts.clear();
  }
}

export const messageQueue = new MessageQueueService();