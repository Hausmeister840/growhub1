/**
 * Render Optimizer
 * Optimizes React rendering performance
 */

class RenderOptimizer {
  constructor() {
    this.componentMetrics = new Map();
  }

  /**
   * Track render
   */
  trackRender(componentName, renderTime) {
    if (!this.componentMetrics.has(componentName)) {
      this.componentMetrics.set(componentName, {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        maxTime: 0
      });
    }

    const metrics = this.componentMetrics.get(componentName);
    metrics.count++;
    metrics.totalTime += renderTime;
    metrics.avgTime = metrics.totalTime / metrics.count;
    metrics.maxTime = Math.max(metrics.maxTime, renderTime);

    // Warn if component is slow
    if (renderTime > 16 && process.env.NODE_ENV === 'development') {
      console.warn(`Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }
  }

  /**
   * Should use virtual scroll
   */
  shouldUseVirtualScroll(itemCount) {
    return itemCount > 50;
  }

  /**
   * Should memo component
   */
  shouldMemoComponent(componentName) {
    const metrics = this.componentMetrics.get(componentName);
    if (!metrics) return false;

    // Memo if component renders frequently
    return metrics.count > 10;
  }

  /**
   * Get render stats
   */
  getStats() {
    const stats = [];
    
    this.componentMetrics.forEach((metrics, name) => {
      stats.push({
        name,
        ...metrics
      });
    });

    return stats.sort((a, b) => b.totalTime - a.totalTime);
  }

  /**
   * Clear metrics
   */
  clear() {
    this.componentMetrics.clear();
  }
}

export default new RenderOptimizer();