/**
 * Adaptive Loading Service
 * Adjusts loading strategy based on device capabilities
 */

class AdaptiveLoading {
  constructor() {
    this.deviceTier = 'medium';
    this.connectionType = 'unknown';
    this.isLowEndDevice = false;
  }

  /**
   * Initialize
   */
  async initialize() {
    this.detectDeviceTier();
    this.detectConnection();
    return this.getLoadingStrategy();
  }

  /**
   * Detect device tier
   */
  detectDeviceTier() {
    if (!navigator.hardwareConcurrency || !navigator.deviceMemory) {
      this.deviceTier = 'medium';
      return;
    }

    const cores = navigator.hardwareConcurrency;
    const memory = navigator.deviceMemory;

    if (cores <= 2 || memory <= 2) {
      this.deviceTier = 'low';
      this.isLowEndDevice = true;
    } else if (cores >= 8 && memory >= 8) {
      this.deviceTier = 'high';
    } else {
      this.deviceTier = 'medium';
    }
  }

  /**
   * Detect connection
   */
  detectConnection() {
    if (!navigator.connection) {
      this.connectionType = 'unknown';
      return;
    }

    const connection = navigator.connection;
    const effectiveType = connection.effectiveType;

    this.connectionType = effectiveType;
  }

  /**
   * Get loading strategy
   */
  getLoadingStrategy() {
    const isSlow = ['slow-2g', '2g', '3g'].includes(this.connectionType);
    
    return {
      // Image quality
      imageQuality: this.isLowEndDevice || isSlow ? 0.7 : 0.9,
      
      // Max image dimensions
      maxImageWidth: this.isLowEndDevice ? 1080 : 1920,
      
      // Preload distance
      preloadDistance: this.isLowEndDevice ? 1 : 3,
      
      // Enable animations
      enableAnimations: !this.isLowEndDevice,
      
      // Video autoplay
      autoplayVideo: !isSlow,
      
      // Lazy load threshold
      lazyLoadThreshold: this.isLowEndDevice ? 0.1 : 0.3,
      
      // Max concurrent requests
      maxConcurrentRequests: this.isLowEndDevice ? 4 : 8,
      
      // Cache size
      cacheSize: this.isLowEndDevice ? 50 : 100,
      
      // Device info
      deviceTier: this.deviceTier,
      connectionType: this.connectionType,
      isLowEndDevice: this.isLowEndDevice
    };
  }

  /**
   * Should use feature
   */
  shouldUseFeature(feature) {
    const strategy = this.getLoadingStrategy();

    const features = {
      animations: strategy.enableAnimations,
      autoplay: strategy.autoplayVideo,
      highQualityImages: strategy.imageQuality >= 0.9,
      virtualScroll: true, // Always use virtual scroll
      lazyLoad: true // Always lazy load
    };

    return features[feature] !== undefined ? features[feature] : true;
  }

  /**
   * Get optimal settings
   */
  getOptimalSettings() {
    return this.getLoadingStrategy();
  }
}

export default new AdaptiveLoading();