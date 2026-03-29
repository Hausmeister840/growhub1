/**
 * Event Coalescing Service
 * Combines multiple events into batches
 */

class EventCoalescing {
  constructor() {
    this.eventQueues = new Map();
    this.flushTimeouts = new Map();
  }

  /**
   * Add event to queue
   */
  addEvent(eventType, data) {
    if (!this.eventQueues.has(eventType)) {
      this.eventQueues.set(eventType, []);
    }

    this.eventQueues.get(eventType).push({
      data,
      timestamp: Date.now()
    });

    this.scheduleFlush(eventType);
  }

  /**
   * Schedule flush
   */
  scheduleFlush(eventType, delay = 100) {
    if (this.flushTimeouts.has(eventType)) {
      clearTimeout(this.flushTimeouts.get(eventType));
    }

    const timeout = setTimeout(() => {
      this.flush(eventType);
    }, delay);

    this.flushTimeouts.set(eventType, timeout);
  }

  /**
   * Flush events
   */
  flush(eventType) {
    const queue = this.eventQueues.get(eventType);
    if (!queue || queue.length === 0) return;

    // Emit batched event
    window.dispatchEvent(new CustomEvent(`batched-${eventType}`, {
      detail: { events: queue }
    }));

    this.eventQueues.set(eventType, []);
    this.flushTimeouts.delete(eventType);
  }

  /**
   * Listen to batched events
   */
  onBatched(eventType, callback) {
    const handler = (e) => callback(e.detail.events);
    window.addEventListener(`batched-${eventType}`, handler);
    
    return () => {
      window.removeEventListener(`batched-${eventType}`, handler);
    };
  }

  /**
   * Clear all
   */
  clear() {
    this.flushTimeouts.forEach(timeout => clearTimeout(timeout));
    this.eventQueues.clear();
    this.flushTimeouts.clear();
  }
}

export default new EventCoalescing();