/**
 * Request Coalescing Service
 * Combines multiple identical requests into one
 */

class RequestCoalescing {
  constructor() {
    this.pendingRequests = new Map();
  }

  /**
   * Coalesce request
   */
  async coalesce(key, requestFn) {
    // Return existing promise if request is pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    // Create new request
    const promise = requestFn()
      .then(result => {
        this.pendingRequests.delete(key);
        return result;
      })
      .catch(error => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * Batch requests
   */
  async batch(requests, batchFn, batchSize = 10) {
    const results = [];
    
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchResults = await batchFn(batch);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Clear pending
   */
  clear() {
    this.pendingRequests.clear();
  }

  /**
   * Get pending count
   */
  getPendingCount() {
    return this.pendingRequests.size;
  }
}

export default new RequestCoalescing();