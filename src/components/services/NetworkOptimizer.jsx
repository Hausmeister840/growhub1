/**
 * Network Optimizer
 * Optimizes network requests based on connection quality
 */

class NetworkOptimizer {
  constructor() {
    this.connection = null;
    this.quality = 'good';
    this.init();
  }

  /**
   * Initialize
   */
  init() {
    if ('connection' in navigator) {
      this.connection = navigator.connection;
      this.updateQuality();
      
      this.connection.addEventListener('change', () => {
        this.updateQuality();
      });
    }
  }

  /**
   * Update quality assessment
   */
  updateQuality() {
    if (!this.connection) {
      this.quality = 'good';
      return;
    }

    const effectiveType = this.connection.effectiveType;
    const saveData = this.connection.saveData;

    if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
      this.quality = 'poor';
    } else if (effectiveType === '3g') {
      this.quality = 'medium';
    } else {
      this.quality = 'good';
    }
  }

  /**
   * Get quality
   */
  getQuality() {
    return this.quality;
  }

  /**
   * Should load high quality
   */
  shouldLoadHighQuality() {
    return this.quality === 'good';
  }

  /**
   * Should preload
   */
  shouldPreload() {
    return this.quality !== 'poor';
  }

  /**
   * Get optimal image quality
   */
  getImageQuality() {
    const qualities = {
      poor: 0.5,
      medium: 0.7,
      good: 0.9
    };
    
    return qualities[this.quality];
  }

  /**
   * Get max concurrent requests
   */
  getMaxConcurrentRequests() {
    const limits = {
      poor: 2,
      medium: 4,
      good: 6
    };
    
    return limits[this.quality];
  }

  /**
   * Get connection info
   */
  getConnectionInfo() {
    if (!this.connection) return null;

    return {
      effectiveType: this.connection.effectiveType,
      downlink: this.connection.downlink,
      rtt: this.connection.rtt,
      saveData: this.connection.saveData,
      quality: this.quality
    };
  }
}

export default new NetworkOptimizer();