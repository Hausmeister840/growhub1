/**
 * Performance Monitor
 * Tracks and reports performance metrics
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoads: [],
      apiCalls: [],
      renders: [],
      interactions: []
    };
    this.observers = [];
  }

  /**
   * Initialize monitoring
   */
  init() {
    this.observeNavigationTiming();
    this.observeLongTasks();
    this.observeResourceTiming();
  }

  /**
   * Observe navigation timing
   */
  observeNavigationTiming() {
    if (!window.performance) return;

    const timing = performance.timing;
    const metrics = {
      dns: timing.domainLookupEnd - timing.domainLookupStart,
      tcp: timing.connectEnd - timing.connectStart,
      ttfb: timing.responseStart - timing.requestStart,
      download: timing.responseEnd - timing.responseStart,
      domInteractive: timing.domInteractive - timing.navigationStart,
      domComplete: timing.domComplete - timing.navigationStart,
      loadComplete: timing.loadEventEnd - timing.navigationStart
    };

    this.metrics.pageLoads.push({
      timestamp: Date.now(),
      ...metrics
    });
  }

  /**
   * Observe long tasks
   */
  observeLongTasks() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) {
            console.warn('Long task detected:', entry.duration + 'ms');
          }
        });
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    } catch (e) {
      // Long task observer not supported
    }
  }

  /**
   * Observe resource timing
   */
  observeResourceTiming() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
            this.metrics.apiCalls.push({
              url: entry.name,
              duration: entry.duration,
              timestamp: Date.now()
            });
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (e) {
      // Resource timing observer not supported
    }
  }

  /**
   * Track render time
   */
  trackRender(componentName, duration) {
    this.metrics.renders.push({
      component: componentName,
      duration,
      timestamp: Date.now()
    });
  }

  /**
   * Track interaction
   */
  trackInteraction(type, duration) {
    this.metrics.interactions.push({
      type,
      duration,
      timestamp: Date.now()
    });
  }

  /**
   * Get metrics summary
   */
  getSummary() {
    return {
      avgApiCallDuration: this.getAverage(this.metrics.apiCalls, 'duration'),
      avgRenderDuration: this.getAverage(this.metrics.renders, 'duration'),
      totalApiCalls: this.metrics.apiCalls.length,
      totalRenders: this.metrics.renders.length
    };
  }

  /**
   * Get average
   */
  getAverage(array, key) {
    if (array.length === 0) return 0;
    const sum = array.reduce((acc, item) => acc + item[key], 0);
    return Math.round(sum / array.length);
  }

  /**
   * Clear metrics
   */
  clear() {
    this.metrics = {
      pageLoads: [],
      apiCalls: [],
      renders: [],
      interactions: []
    };
  }

  /**
   * Disconnect observers
   */
  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

export default new PerformanceMonitor();