/**
 * Smart Cache Service
 * Intelligent caching with TTL and priority
 */

class SmartCache {
  constructor() {
    this.cache = new Map();
    this.metadata = new Map();
  }

  /**
   * Set cache item
   */
  set(key, value, options = {}) {
    const {
      ttl = 300000, // 5 minutes default
      priority = 'medium',
      tags = []
    } = options;

    this.cache.set(key, value);
    this.metadata.set(key, {
      timestamp: Date.now(),
      ttl,
      priority,
      tags,
      hits: 0
    });

    this.pruneCache();
  }

  /**
   * Get cache item
   */
  get(key) {
    if (!this.cache.has(key)) return null;

    const meta = this.metadata.get(key);
    if (!meta) return null;

    // Check if expired
    if (Date.now() - meta.timestamp > meta.ttl) {
      this.delete(key);
      return null;
    }

    // Update hits
    meta.hits++;
    this.metadata.set(key, meta);

    return this.cache.get(key);
  }

  /**
   * Delete cache item
   */
  delete(key) {
    this.cache.delete(key);
    this.metadata.delete(key);
  }

  /**
   * Clear by tag
   */
  clearByTag(tag) {
    this.metadata.forEach((meta, key) => {
      if (meta.tags.includes(tag)) {
        this.delete(key);
      }
    });
  }

  /**
   * Prune cache
   */
  pruneCache() {
    const MAX_SIZE = 100;
    if (this.cache.size <= MAX_SIZE) return;

    // Sort by priority and hits
    const entries = Array.from(this.metadata.entries())
      .map(([key, meta]) => ({ key, ...meta }))
      .sort((a, b) => {
        const priorityOrder = { low: 0, medium: 1, high: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.hits - b.hits;
      });

    // Remove lowest priority items
    const toRemove = entries.slice(0, this.cache.size - MAX_SIZE);
    toRemove.forEach(item => this.delete(item.key));
  }

  /**
   * Clear all
   */
  clear() {
    this.cache.clear();
    this.metadata.clear();
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      size: this.cache.size,
      items: Array.from(this.metadata.entries()).map(([key, meta]) => ({
        key,
        age: Date.now() - meta.timestamp,
        hits: meta.hits,
        priority: meta.priority
      }))
    };
  }
}

export default new SmartCache();