/**
 * Notification Batch Service
 * Smart batching and prioritization of notifications
 */

class NotificationBatchService {
  constructor() {
    this.queue = [];
    this.batchTimeout = null;
    this.batchDelay = 2000; // 2 seconds
    this.priorities = {
      message: 3,
      follow: 2,
      comment: 2,
      like: 1,
      reaction: 1
    };
  }

  /**
   * Add notification to queue
   */
  add(notification) {
    this.queue.push({
      ...notification,
      timestamp: Date.now(),
      priority: this.priorities[notification.type] || 1
    });

    this.scheduleFlush();
  }

  /**
   * Schedule batch flush
   */
  scheduleFlush() {
    if (this.batchTimeout) return;

    this.batchTimeout = setTimeout(() => {
      this.flush();
    }, this.batchDelay);
  }

  /**
   * Flush batch and show notifications
   */
  flush() {
    if (this.queue.length === 0) return;

    // Sort by priority
    const sorted = [...this.queue].sort((a, b) => b.priority - a.priority);

    // Group by type
    const grouped = this.groupByType(sorted);

    // Show batched notifications
    this.showBatched(grouped);

    // Clear queue
    this.queue = [];
    this.batchTimeout = null;
  }

  /**
   * Group notifications by type
   */
  groupByType(notifications) {
    const groups = {};

    notifications.forEach(notif => {
      if (!groups[notif.type]) {
        groups[notif.type] = [];
      }
      groups[notif.type].push(notif);
    });

    return groups;
  }

  /**
   * Show batched notifications
   */
  showBatched(grouped) {
    Object.entries(grouped).forEach(([type, notifications]) => {
      if (notifications.length === 1) {
        this.showSingle(notifications[0]);
      } else {
        this.showGrouped(type, notifications);
      }
    });
  }

  /**
   * Show single notification
   */
  showSingle(notification) {
    const event = new CustomEvent('show-notification', {
      detail: notification
    });
    window.dispatchEvent(event);
  }

  /**
   * Show grouped notification
   */
  showGrouped(type, notifications) {
    const event = new CustomEvent('show-notification', {
      detail: {
        type: `${type}_group`,
        count: notifications.length,
        items: notifications
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * Clear queue
   */
  clear() {
    this.queue = [];
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }
}

export default new NotificationBatchService();