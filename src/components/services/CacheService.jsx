/**
 * 💾 CACHE SERVICE - Advanced caching with TTL and size limits
 */

class CacheService {
  constructor(maxSize = 100, defaultTTL = 5 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.accessCount = new Map();
  }

  /**
   * Set item in cache with TTL
   */
  set(key, value, ttl = this.defaultTTL) {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      expires: Date.now() + ttl,
      created: Date.now()
    });

    this.accessCount.set(key, 0);
  }

  /**
   * Get item from cache
   */
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) return null;

    // Check if expired
    if (item.expires < Date.now()) {
      this.delete(key);
      return null;
    }

    // Update access count
    this.accessCount.set(key, (this.accessCount.get(key) || 0) + 1);

    return item.value;
  }

  /**
   * Check if key exists and is valid
   */
  has(key) {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (item.expires < Date.now()) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete item from cache
   */
  delete(key) {
    this.cache.delete(key);
    this.accessCount.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    this.accessCount.clear();
  }

  /**
   * Evict least recently used item
   */
  evictLRU() {
    let lruKey = null;
    let minAccess = Infinity;

    for (const [key, count] of this.accessCount.entries()) {
      if (count < minAccess) {
        minAccess = count;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.delete(lruKey);
    }
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.calculateHitRate()
    };
  }

  /**
   * Calculate cache hit rate
   */
  calculateHitRate() {
    const totalAccess = Array.from(this.accessCount.values())
      .reduce((sum, count) => sum + count, 0);
    
    return totalAccess > 0 ? (totalAccess / this.cache.size).toFixed(2) : 0;
  }

  /**
   * Cleanup expired items
   */
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (item.expires < now) {
        this.delete(key);
      }
    }
  }
}

export const cacheService = new CacheService();
export default cacheService;