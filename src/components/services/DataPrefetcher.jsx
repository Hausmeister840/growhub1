/**
 * Data Prefetcher
 * Prefetches data based on user navigation patterns
 */

class DataPrefetcher {
  constructor() {
    this.prefetchCache = new Map();
    this.prefetchQueue = [];
    this.isProcessing = false;
  }

  /**
   * Prefetch data
   */
  async prefetch(key, fetchFn, options = {}) {
    const { priority = 'low', ttl = 300000 } = options;

    // Return cached if available
    if (this.prefetchCache.has(key)) {
      const cached = this.prefetchCache.get(key);
      if (Date.now() - cached.timestamp < ttl) {
        return cached.data;
      }
    }

    // Add to queue
    this.prefetchQueue.push({
      key,
      fetchFn,
      priority,
      ttl
    });

    // Sort by priority
    this.prefetchQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    this.processQueue();
  }

  /**
   * Process prefetch queue
   */
  async processQueue() {
    if (this.isProcessing || this.prefetchQueue.length === 0) return;

    this.isProcessing = true;

    while (this.prefetchQueue.length > 0) {
      const item = this.prefetchQueue.shift();

      try {
        const data = await item.fetchFn();
        
        this.prefetchCache.set(item.key, {
          data,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('Prefetch error:', error);
      }

      // Small delay between prefetches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isProcessing = false;
  }

  /**
   * Get prefetched data
   */
  get(key) {
    const cached = this.prefetchCache.get(key);
    return cached ? cached.data : null;
  }

  /**
   * Clear cache
   */
  clear() {
    this.prefetchCache.clear();
    this.prefetchQueue = [];
  }

  /**
   * Get cache size
   */
  getSize() {
    return this.prefetchCache.size;
  }
}

export default new DataPrefetcher();