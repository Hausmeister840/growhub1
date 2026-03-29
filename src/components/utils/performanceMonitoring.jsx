/**
 * ⚡ PERFORMANCE MONITORING
 * Tracks app performance metrics
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.marks = new Map();
    this.isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // Start monitoring
    if (typeof window !== 'undefined') {
      this.observePerformance();
      this.observeErrors();
    }
  }

  // Start a performance mark
  mark(name) {
    this.marks.set(name, performance.now());
  }

  // Measure time since mark
  measure(name, markName) {
    const startTime = this.marks.get(markName);
    if (!startTime) return 0;

    const duration = performance.now() - startTime;
    this.marks.delete(markName);

    // Log metric
    this.logMetric(name, duration);

    return duration;
  }

  // Log a metric
  logMetric(name, value, tags = {}) {
    const metric = {
      name,
      value,
      timestamp: Date.now(),
      tags: {
        page: window.location.pathname,
        ...tags
      }
    };

    // Store metric
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name).push(metric);

    // Log to console in dev
    if (this.isDev) {
      console.log(`⚡ ${name}:`, value.toFixed(2), 'ms', tags);
    }

    // Send to analytics
    this.sendMetric(metric);
  }

  // Send metric to backend
  async sendMetric(metric) {
    try {
      // Batch metrics for efficiency
      const batch = this.metrics.get(metric.name) || [];
      
      if (batch.length >= 10) {
        // Send batch
        await fetch('/api/analytics/performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ metrics: batch })
        });

        // Clear batch
        this.metrics.set(metric.name, []);
      }
    } catch (error) {
      console.error('Failed to send metric:', error);
    }
  }

  // Observe Web Vitals
  observePerformance() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.logMetric('lcp', lastEntry.renderTime || lastEntry.loadTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.logMetric('fid', entry.processingStart - entry.startTime);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift (CLS)
        let clsScore = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (!entry.hadRecentInput) {
              clsScore += entry.value;
            }
          });
          this.logMetric('cls', clsScore);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

      } catch (error) {
        console.error('Performance observer error:', error);
      }
    }

    // Time to First Byte (TTFB)
    window.addEventListener('load', () => {
      const navTiming = performance.getEntriesByType('navigation')[0];
      if (navTiming) {
        const ttfb = navTiming.responseStart - navTiming.requestStart;
        this.logMetric('ttfb', ttfb);

        const domContentLoaded = navTiming.domContentLoadedEventEnd - navTiming.domContentLoadedEventStart;
        this.logMetric('dom_content_loaded', domContentLoaded);

        const loadComplete = navTiming.loadEventEnd - navTiming.loadEventStart;
        this.logMetric('load_complete', loadComplete);
      }
    });
  }

  // Observe errors
  observeErrors() {
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'unhandled_rejection',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack
      });
    });
  }

  // Log error
  async logError(error) {
    console.error('💥 Error logged:', error);

    try {
      await fetch('/api/analytics/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...error,
          page: window.location.pathname,
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      });
    } catch (e) {
      console.error('Failed to log error:', e);
    }
  }

  // Get metric summary
  getMetrics(name) {
    const metrics = this.metrics.get(name) || [];
    if (metrics.length === 0) return null;

    const values = metrics.map(m => m.value);
    const sum = values.reduce((a, b) => a + b, 0);
    
    return {
      count: values.length,
      avg: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      p50: this.percentile(values, 50),
      p95: this.percentile(values, 95),
      p99: this.percentile(values, 99)
    };
  }

  percentile(values, p) {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }

  // Get all metrics
  getAllMetrics() {
    const result = {};
    for (const [name] of this.metrics) {
      result[name] = this.getMetrics(name);
    }
    return result;
  }
}

export const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor;