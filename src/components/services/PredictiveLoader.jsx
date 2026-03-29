/**
 * Predictive Loader
 * Predicts and preloads content user is likely to interact with
 */

class PredictiveLoader {
  constructor() {
    this.userBehavior = {
      clicks: [],
      scrolls: [],
      hovers: []
    };
    this.predictions = new Map();
  }

  /**
   * Track user interaction
   */
  trackInteraction(type, target) {
    const interaction = {
      type,
      target,
      timestamp: Date.now()
    };

    if (type === 'click') this.userBehavior.clicks.push(interaction);
    if (type === 'scroll') this.userBehavior.scrolls.push(interaction);
    if (type === 'hover') this.userBehavior.hovers.push(interaction);

    // Keep last 100 interactions
    if (this.userBehavior[type].length > 100) {
      this.userBehavior[type].shift();
    }

    this.updatePredictions();
  }

  /**
   * Update predictions based on behavior
   */
  updatePredictions() {
    // Predict based on recent patterns
    const recentClicks = this.userBehavior.clicks.slice(-10);
    
    recentClicks.forEach(click => {
      const pattern = this.findPattern(click.target);
      if (pattern) {
        this.predictions.set(pattern.next, pattern.confidence);
      }
    });
  }

  /**
   * Find interaction pattern
   */
  findPattern(target) {
    // Simple pattern: if user views multiple posts, likely to view more
    if (target.includes('post')) {
      return {
        next: 'load-more-posts',
        confidence: 0.8
      };
    }

    // If user opens comments, likely to interact more
    if (target.includes('comment')) {
      return {
        next: 'load-replies',
        confidence: 0.7
      };
    }

    return null;
  }

  /**
   * Get prediction for action
   */
  getPrediction(action) {
    return this.predictions.get(action) || 0;
  }

  /**
   * Should preload based on prediction
   */
  shouldPreload(action, threshold = 0.6) {
    return this.getPrediction(action) >= threshold;
  }

  /**
   * Preload resource
   */
  preloadResource(url, type = 'fetch') {
    if (!url) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = type;
    link.href = url;
    document.head.appendChild(link);
  }

  /**
   * Clear predictions
   */
  clear() {
    this.predictions.clear();
    this.userBehavior = {
      clicks: [],
      scrolls: [],
      hovers: []
    };
  }
}

export default new PredictiveLoader();