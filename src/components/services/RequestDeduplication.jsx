/**
 * Request Deduplication Service
 * Prevents duplicate simultaneous requests
 */

class RequestDeduplication {
  constructor() {
    this.pendingRequests = new Map();
  }

  /**
   * Execute deduplicated request
   */
  async execute(key, requestFn) {
    // Return existing promise if request is pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    // Create new promise
    const promise = requestFn()
      .finally(() => {
        // Clean up after completion
        this.pendingRequests.delete(key);
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * Cancel pending request
   */
  cancel(key) {
    this.pendingRequests.delete(key);
  }

  /**
   * Clear all pending requests
   */
  clearAll() {
    this.pendingRequests.clear();
  }

  /**
   * Get pending count
   */
  getPendingCount() {
    return this.pendingRequests.size;
  }
}

export default new RequestDeduplication();