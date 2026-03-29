/**
 * Video Optimization Service
 * Handles video preloading, quality adaptation, and playback optimization
 */

class VideoOptimizationService {
  constructor() {
    this.videoCache = new Map();
    this.observers = new Map();
    this.playbackStates = new Map();
    this.connectionQuality = 'high';
    
    this.initConnectionMonitoring();
  }

  /**
   * Monitor connection quality
   */
  initConnectionMonitoring() {
    if ('connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      const updateQuality = () => {
        const effectiveType = connection.effectiveType;
        
        if (effectiveType === '4g') {
          this.connectionQuality = 'high';
        } else if (effectiveType === '3g') {
          this.connectionQuality = 'medium';
        } else {
          this.connectionQuality = 'low';
        }
      };

      updateQuality();
      connection.addEventListener('change', updateQuality);
    }
  }

  /**
   * Get optimal video quality based on connection
   */
  getOptimalQuality() {
    return this.connectionQuality;
  }

  /**
   * Preload video metadata
   */
  preloadVideo(src) {
    if (!src || this.videoCache.has(src)) return;

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = src;
    
    this.videoCache.set(src, {
      element: video,
      loaded: false,
      metadata: null
    });

    video.addEventListener('loadedmetadata', () => {
      this.videoCache.set(src, {
        element: video,
        loaded: true,
        metadata: {
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight
        }
      });
    });
  }

  /**
   * Setup intersection observer for lazy video loading
   */
  observeVideo(element, onVisible, onHidden) {
    if (!element || this.observers.has(element)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onVisible?.();
          } else {
            onHidden?.();
          }
        });
      },
      {
        threshold: 0.5,
        rootMargin: '50px'
      }
    );

    observer.observe(element);
    this.observers.set(element, observer);
  }

  /**
   * Cleanup observer
   */
  unobserveVideo(element) {
    const observer = this.observers.get(element);
    if (observer) {
      observer.disconnect();
      this.observers.delete(element);
    }
  }

  /**
   * Optimize video playback
   */
  optimizePlayback(videoElement) {
    if (!videoElement) return;

    // Reduce quality on slow connections
    if (this.connectionQuality === 'low') {
      videoElement.playbackRate = 1;
      // Consider implementing adaptive bitrate here
    }

    // Preload strategy
    if (this.connectionQuality === 'high') {
      videoElement.preload = 'auto';
    } else {
      videoElement.preload = 'metadata';
    }
  }

  /**
   * Track playback state
   */
  trackPlayback(videoId, state) {
    this.playbackStates.set(videoId, {
      state,
      timestamp: Date.now()
    });
  }

  /**
   * Get playback state
   */
  getPlaybackState(videoId) {
    return this.playbackStates.get(videoId);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.videoCache.clear();
    this.playbackStates.clear();
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.clearCache();
  }
}

export default new VideoOptimizationService();