/**
 * Intersection Observer Pool
 * Shares observers to reduce overhead
 */

class IntersectionObserverPool {
  constructor() {
    this.observers = new Map();
    this.elements = new Map();
  }

  /**
   * Observe element
   */
  observe(element, callback, options = {}) {
    const key = this.getOptionsKey(options);

    // Create observer if needed
    if (!this.observers.has(key)) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const callbacks = this.elements.get(entry.target);
          if (callbacks) {
            callbacks.forEach(cb => cb(entry));
          }
        });
      }, options);

      this.observers.set(key, observer);
    }

    const observer = this.observers.get(key);

    // Track element callbacks
    if (!this.elements.has(element)) {
      this.elements.set(element, new Set());
    }
    this.elements.get(element).add(callback);

    observer.observe(element);

    // Return cleanup function
    return () => this.unobserve(element, callback, key);
  }

  /**
   * Unobserve element
   */
  unobserve(element, callback, key) {
    const callbacks = this.elements.get(element);
    if (!callbacks) return;

    callbacks.delete(callback);

    // Remove element if no more callbacks
    if (callbacks.size === 0) {
      this.elements.delete(element);
      const observer = this.observers.get(key);
      if (observer) {
        observer.unobserve(element);
      }
    }
  }

  /**
   * Get options key
   */
  getOptionsKey(options) {
    return JSON.stringify({
      threshold: options.threshold || 0,
      rootMargin: options.rootMargin || '0px',
      root: options.root || null
    });
  }

  /**
   * Disconnect all
   */
  disconnectAll() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.elements.clear();
  }
}

export default new IntersectionObserverPool();