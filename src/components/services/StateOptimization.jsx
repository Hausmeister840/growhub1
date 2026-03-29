/**
 * State Optimization Service
 * Optimizes state updates and prevents unnecessary renders
 */

class StateOptimization {
  constructor() {
    this.stateCache = new Map();
    this.updateQueue = new Map();
    this.flushTimeout = null;
  }

  /**
   * Batch state updates
   */
  batchUpdate(key, value, callback) {
    if (!this.updateQueue.has(key)) {
      this.updateQueue.set(key, []);
    }

    this.updateQueue.get(key).push({ value, callback });
    this.scheduleFlush();
  }

  /**
   * Schedule flush
   */
  scheduleFlush() {
    if (this.flushTimeout) return;

    this.flushTimeout = requestAnimationFrame(() => {
      this.flush();
    });
  }

  /**
   * Flush updates
   */
  flush() {
    this.updateQueue.forEach((updates, key) => {
      const lastUpdate = updates[updates.length - 1];
      
      if (lastUpdate.callback) {
        lastUpdate.callback(lastUpdate.value);
      }

      this.stateCache.set(key, lastUpdate.value);
    });

    this.updateQueue.clear();
    this.flushTimeout = null;
  }

  /**
   * Check if value changed
   */
  hasChanged(key, newValue) {
    if (!this.stateCache.has(key)) return true;
    
    const oldValue = this.stateCache.get(key);
    return !this.shallowEqual(oldValue, newValue);
  }

  /**
   * Shallow equality check
   */
  shallowEqual(obj1, obj2) {
    if (obj1 === obj2) return true;
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;
    if (obj1 === null || obj2 === null) return false;

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    return keys1.every(key => obj1[key] === obj2[key]);
  }

  /**
   * Clear cache
   */
  clear() {
    this.stateCache.clear();
    this.updateQueue.clear();
  }
}

export default new StateOptimization();