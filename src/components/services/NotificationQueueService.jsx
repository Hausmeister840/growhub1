/**
 * Notification Queue Service
 * Manages notification queue, deduplication, and throttling
 */

class NotificationQueueService {
  constructor() {
    this.queue = [];
    this.shown = new Set();
    this.throttleDelay = 1000;
    this.lastShown = 0;
    this.processing = false;
  }

  /**
   * Add notification to queue
   */
  add(notification) {
    // Deduplicate
    const key = this.getNotificationKey(notification);
    if (this.shown.has(key)) return;

    this.queue.push(notification);
    this.processQueue();
  }

  /**
   * Get notification key for deduplication
   */
  getNotificationKey(notification) {
    return `${notification.type}:${notification.sender_email}:${notification.post_id || ''}`;
  }

  /**
   * Process queue
   */
  async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastShown = now - this.lastShown;

      // Throttle notifications
      if (timeSinceLastShown < this.throttleDelay) {
        await new Promise(resolve => 
          setTimeout(resolve, this.throttleDelay - timeSinceLastShown)
        );
      }

      const notification = this.queue.shift();
      await this.showNotification(notification);

      this.lastShown = Date.now();
      this.shown.add(this.getNotificationKey(notification));
    }

    this.processing = false;
  }

  /**
   * Show notification
   */
  async showNotification(notification) {
    const event = new CustomEvent('show-toast-notification', {
      detail: notification
    });
    window.dispatchEvent(event);
  }

  /**
   * Clear shown notifications
   */
  clearShown() {
    this.shown.clear();
  }

  /**
   * Clear queue
   */
  clearQueue() {
    this.queue = [];
  }
}

export default new NotificationQueueService();