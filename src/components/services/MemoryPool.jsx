/**
 * Memory Pool
 * Reuses objects to reduce GC pressure
 */

class MemoryPool {
  constructor() {
    this.pools = new Map();
  }

  /**
   * Create pool
   */
  createPool(name, factory, size = 10) {
    const pool = {
      factory,
      available: [],
      inUse: new Set(),
      created: 0,
      maxSize: size
    };

    // Pre-populate pool
    for (let i = 0; i < Math.min(5, size); i++) {
      pool.available.push(factory());
      pool.created++;
    }

    this.pools.set(name, pool);
  }

  /**
   * Acquire object from pool
   */
  acquire(name) {
    const pool = this.pools.get(name);
    if (!pool) {
      throw new Error(`Pool "${name}" not found`);
    }

    let obj;

    if (pool.available.length > 0) {
      obj = pool.available.pop();
    } else if (pool.created < pool.maxSize) {
      obj = pool.factory();
      pool.created++;
    } else {
      // Pool exhausted, create anyway but log warning
      console.warn(`Pool "${name}" exhausted`);
      obj = pool.factory();
    }

    pool.inUse.add(obj);
    return obj;
  }

  /**
   * Release object back to pool
   */
  release(name, obj) {
    const pool = this.pools.get(name);
    if (!pool) return;

    if (pool.inUse.has(obj)) {
      pool.inUse.delete(obj);
      
      // Reset object if it has a reset method
      if (typeof obj.reset === 'function') {
        obj.reset();
      }

      pool.available.push(obj);
    }
  }

  /**
   * Clear pool
   */
  clear(name) {
    if (name) {
      this.pools.delete(name);
    } else {
      this.pools.clear();
    }
  }

  /**
   * Get stats
   */
  getStats(name) {
    const pool = this.pools.get(name);
    if (!pool) return null;

    return {
      name,
      available: pool.available.length,
      inUse: pool.inUse.size,
      created: pool.created,
      maxSize: pool.maxSize
    };
  }
}

export default new MemoryPool();