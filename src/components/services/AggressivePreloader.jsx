/**
 * 🚀 AGGRESSIVE MEDIA PRELOADER - COMPLETE & WORKING
 * Intelligentes Video/Bild Preloading mit Netzwerk-Awareness
 */

class AggressivePreloader {
  constructor() {
    this.cache = new Map();
    this.loading = new Set();
    this.preloadQueue = [];
    this.isProcessingQueue = false;
    
    // Network & Device Detection
    this.networkSpeed = this.detectNetworkSpeed();
    this.deviceMemory = this.getDeviceMemory();
    this.batteryLevel = 1;
    this.isLowPowerMode = false;
    
    // Adaptive Settings
    this.maxConcurrent = this.getOptimalConcurrency();
    this.currentLoading = 0;
    
    // Statistics
    this.stats = {
      hits: 0,
      misses: 0,
      errors: 0,
      totalPreloaded: 0
    };
    
    this.init();
  }

  init() {
    this.monitorNetwork();
    this.monitorBattery();
    this.startQueueProcessor();
    
    // Log stats every 30 seconds
    if (typeof window !== 'undefined') {
      setInterval(() => {
        if (this.stats.totalPreloaded > 0) {
          const hitRate = (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(1);
          console.log(`📊 Preloader: ${hitRate}% hit, ${this.cache.size} cached, ${this.stats.errors} errors`);
        }
      }, 30000);
    }
  }

  detectNetworkSpeed() {
    if (typeof navigator === 'undefined') return 'fast';
    
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!connection) return 'fast';
    
    const type = connection.effectiveType;
    
    if (type === 'slow-2g' || type === '2g') return 'slow';
    if (type === '3g') return 'medium';
    return 'fast';
  }

  getDeviceMemory() {
    if (typeof navigator !== 'undefined' && 'deviceMemory' in navigator) {
      return navigator.deviceMemory;
    }
    return 4;
  }

  getOptimalConcurrency() {
    if (this.networkSpeed === 'slow') return 1;
    if (this.networkSpeed === 'medium') return 2;
    if (this.deviceMemory < 4) return 2;
    return 3;
  }

  monitorNetwork() {
    if (typeof navigator === 'undefined') return;
    
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      connection.addEventListener('change', () => {
        this.networkSpeed = this.detectNetworkSpeed();
        this.maxConcurrent = this.getOptimalConcurrency();
        console.log(`📶 Network: ${this.networkSpeed} (concurrent: ${this.maxConcurrent})`);
      });
    }
  }

  monitorBattery() {
    if (typeof navigator === 'undefined' || !('getBattery' in navigator)) return;
    
    navigator.getBattery().then(battery => {
      const updateBatteryStatus = () => {
        this.batteryLevel = battery.level;
        this.isLowPowerMode = !battery.charging && battery.level < 0.2;
        
        if (this.isLowPowerMode) {
          this.maxConcurrent = Math.min(this.maxConcurrent, 1);
        }
      };
      
      updateBatteryStatus();
      battery.addEventListener('levelchange', updateBatteryStatus);
      battery.addEventListener('chargingchange', updateBatteryStatus);
    }).catch(() => {
      // Battery API not supported, ignore
    });
  }

  /**
   * Main preload method - adds to queue or loads immediately
   */
  preload(url, mediaType = 'auto', priority = 'normal') {
    if (!url || typeof url !== 'string') return;
    
    // Already cached
    if (this.cache.has(url)) {
      this.stats.hits++;
      return Promise.resolve(this.cache.get(url));
    }

    // Already loading
    if (this.loading.has(url)) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.cache.has(url)) {
            clearInterval(checkInterval);
            resolve(this.cache.get(url));
          }
        }, 100);
        
        // Timeout after 30 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve(null);
        }, 30000);
      });
    }

    this.stats.misses++;

    // Determine actual media type
    let actualType = mediaType;
    if (mediaType === 'auto') {
      actualType = url.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image';
    }

    // Convert priority string to number
    const priorityNum = this.getPriorityNumber(priority);

    // Add to queue
    this.addToQueue(url, actualType, priorityNum);
  }

  getPriorityNumber(priority) {
    if (typeof priority === 'number') return priority;
    
    const priorityMap = {
      'low': 1,
      'normal': 2,
      'high': 3,
      'critical': 4
    };
    
    return priorityMap[priority] || 2;
  }

  addToQueue(url, mediaType, priority) {
    if (!url || this.cache.has(url) || this.loading.has(url)) return;
    
    const existingIndex = this.preloadQueue.findIndex(item => item.url === url);
    if (existingIndex !== -1) {
      // Update priority if higher
      if (this.preloadQueue[existingIndex].priority < priority) {
        this.preloadQueue[existingIndex].priority = priority;
      }
      return;
    }
    
    this.preloadQueue.push({ url, mediaType, priority });
    this.preloadQueue.sort((a, b) => b.priority - a.priority);
  }

  async startQueueProcessor() {
    if (this.isProcessingQueue) return;
    
    this.isProcessingQueue = true;
    
    while (true) {
      // Process queue
      while (this.preloadQueue.length > 0 && this.currentLoading < this.maxConcurrent) {
        const item = this.preloadQueue.shift();
        if (!item) break;
        
        this.preloadItem(item.url, item.mediaType, item.priority);
      }
      
      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async preloadItem(url, mediaType, priority) {
    if (this.cache.has(url) || this.loading.has(url)) return;
    
    this.loading.add(url);
    this.currentLoading++;
    
    try {
      const isVideo = mediaType === 'video' || url.match(/\.(mp4|webm|mov)$/i);
      
      if (isVideo) {
        await this.preloadVideo(url, priority);
      } else {
        await this.preloadImage(url);
      }
      
      this.stats.totalPreloaded++;
      
    } catch (error) {
      this.stats.errors++;
      console.warn(`⚠️ Preload failed: ${url}`, error.message);
    } finally {
      this.loading.delete(url);
      this.currentLoading--;
    }
  }

  async preloadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      const timeout = setTimeout(() => {
        reject(new Error('Image timeout'));
      }, 15000);
      
      img.onload = () => {
        clearTimeout(timeout);
        this.cache.set(url, { 
          type: 'image', 
          element: img, 
          loadedAt: Date.now() 
        });
        resolve(img);
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Image load failed'));
      };
      
      img.src = url;
    });
  }

  async preloadVideo(url, priority) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      
      // Adjust preload based on priority and network
      if (priority >= 3 && this.networkSpeed === 'fast') {
        video.preload = 'auto';
      } else {
        video.preload = 'metadata';
      }
      
      video.muted = true;
      video.playsInline = true;
      
      const timeout = setTimeout(() => {
        reject(new Error('Video timeout'));
      }, 20000);
      
      video.onloadeddata = () => {
        clearTimeout(timeout);
        this.cache.set(url, { 
          type: 'video', 
          element: video, 
          loadedAt: Date.now() 
        });
        resolve(video);
      };
      
      video.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Video load failed'));
      };
      
      video.src = url;
      video.load();
    });
  }

  /**
   * Preload next posts in feed
   */
  preloadNextPosts(posts, currentIndex, count = 3) {
    if (!Array.isArray(posts) || posts.length === 0) return;
    
    const adjustedCount = this.networkSpeed === 'slow' ? 1 : 
                          this.networkSpeed === 'medium' ? 2 : count;
    
    const nextPosts = posts.slice(currentIndex + 1, currentIndex + 1 + adjustedCount);
    
    nextPosts.forEach((post, idx) => {
      if (!post || !post.media_urls) return;
      
      const priority = idx === 0 ? 3 : idx === 1 ? 2 : 1;
      
      post.media_urls.forEach(url => {
        if (!url) return;
        const mediaType = url.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image';
        this.addToQueue(url, mediaType, priority);
      });
    });
  }

  /**
   * Preload range (for Reels/Swipe viewer)
   */
  preloadRange(posts, currentIndex, range = 3) {
    if (!Array.isArray(posts) || posts.length === 0) return;
    
    // Current post - highest priority
    if (posts[currentIndex] && posts[currentIndex].media_urls) {
      posts[currentIndex].media_urls.forEach(url => {
        if (!url) return;
        const mediaType = url.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image';
        this.addToQueue(url, mediaType, 5);
      });
    }
    
    // Next post - high priority
    if (currentIndex + 1 < posts.length && posts[currentIndex + 1].media_urls) {
      posts[currentIndex + 1].media_urls.forEach(url => {
        if (!url) return;
        const mediaType = url.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image';
        this.addToQueue(url, mediaType, 4);
      });
    }
    
    // Previous post - medium priority
    if (currentIndex > 0 && posts[currentIndex - 1].media_urls) {
      posts[currentIndex - 1].media_urls.forEach(url => {
        if (!url) return;
        const mediaType = url.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image';
        this.addToQueue(url, mediaType, 3);
      });
    }
    
    // Next-next post - lower priority
    if (currentIndex + 2 < posts.length && posts[currentIndex + 2].media_urls) {
      posts[currentIndex + 2].media_urls.forEach(url => {
        if (!url) return;
        const mediaType = url.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image';
        this.addToQueue(url, mediaType, 2);
      });
    }
  }

  /**
   * Get optimal preload count based on network
   */
  getOptimalPreloadCount() {
    if (this.networkSpeed === 'slow') return 1;
    if (this.networkSpeed === 'medium') return 2;
    if (this.isLowPowerMode) return 1;
    return 3;
  }

  /**
   * Check if cached
   */
  isCached(url) {
    const cached = this.cache.has(url);
    if (cached) {
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }
    return cached;
  }

  /**
   * Get from cache
   */
  get(url) {
    return this.cache.get(url);
  }

  /**
   * Clear old cache entries
   */
  clearOldCache(maxAge = 300000) {
    const now = Date.now();
    const toDelete = [];
    
    this.cache.forEach((value, key) => {
      if (now - value.loadedAt > maxAge) {
        toDelete.push(key);
      }
    });
    
    toDelete.forEach(key => this.cache.delete(key));
    
    if (toDelete.length > 0) {
      console.log(`🧹 Cleared ${toDelete.length} old cache entries`);
    }
  }

  /**
   * Clear entire cache
   */
  clearCache() {
    this.cache.clear();
    this.preloadQueue = [];
    this.loading.clear();
    console.log('🧹 Cache cleared');
  }

  /**
   * Get cache size
   */
  getCacheSize() {
    return this.cache.size;
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      queueSize: this.preloadQueue.length,
      loading: this.currentLoading,
      network: this.networkSpeed,
      lowPower: this.isLowPowerMode
    };
  }
}

// Create singleton instance
const aggressivePreloader = new AggressivePreloader();

// Auto-cleanup old cache every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    aggressivePreloader.clearOldCache();
  }, 300000);
}

export { aggressivePreloader };
export default aggressivePreloader;