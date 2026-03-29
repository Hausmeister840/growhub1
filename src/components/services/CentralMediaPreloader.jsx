/**
 * 🎯 CENTRAL MEDIA PRELOADER
 * Manages intelligent preloading of images and videos
 */

class CentralMediaPreloader {
  constructor() {
    this.cache = new Map();
    this.observers = new Map();
    this.preloadQueue = [];
    this.isProcessing = false;
  }

  /**
   * Preload media immediately (for priority content)
   */
  async preloadMedia(url, type = 'image') {
    if (!url || this.cache.has(url)) return;

    try {
      if (type === 'image') {
        const img = new Image();
        img.src = url;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
      } else if (type === 'video') {
        const video = document.createElement('video');
        video.src = url;
        video.preload = 'metadata';
        await new Promise((resolve) => {
          video.onloadedmetadata = resolve;
        });
      }

      this.cache.set(url, true);
    } catch (error) {
      console.warn(`Preload failed for ${url}:`, error);
    }
  }

  /**
   * Observe element and preload when visible
   */
  observe(element, url, type = 'image', immediate = false) {
    if (!element || !url) return;

    if (immediate) {
      this.preloadMedia(url, type);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          this.preloadMedia(url, type);
          observer.disconnect();
        }
      },
      {
        rootMargin: '300px'
      }
    );

    observer.observe(element);
    this.observers.set(element, observer);
  }

  /**
   * Unobserve element
   */
  unobserve(element) {
    const observer = this.observers.get(element);
    if (observer) {
      observer.disconnect();
      this.observers.delete(element);
    }
  }

  /**
   * Check if media is cached
   */
  isCached(url) {
    return this.cache.has(url);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
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

const mediaPreloader = new CentralMediaPreloader();
export default mediaPreloader;