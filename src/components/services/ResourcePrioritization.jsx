/**
 * Resource Prioritization Service
 * Manages loading priorities for optimal performance
 */

class ResourcePrioritization {
  constructor() {
    this.priorities = {
      critical: [],
      high: [],
      medium: [],
      low: []
    };
    this.loaded = new Set();
    this.loading = new Set();
  }

  /**
   * Add resource to queue
   */
  add(resource, priority = 'medium') {
    if (this.loaded.has(resource.url)) return;
    if (this.loading.has(resource.url)) return;

    if (!this.priorities[priority]) {
      priority = 'medium';
    }

    this.priorities[priority].push(resource);
    this.processQueue();
  }

  /**
   * Process loading queue
   */
  async processQueue() {
    // Load in priority order
    const order = ['critical', 'high', 'medium', 'low'];

    for (const priority of order) {
      const queue = this.priorities[priority];
      
      while (queue.length > 0) {
        const resource = queue.shift();
        
        if (this.loaded.has(resource.url) || this.loading.has(resource.url)) {
          continue;
        }

        await this.loadResource(resource);
      }
    }
  }

  /**
   * Load single resource
   */
  async loadResource(resource) {
    this.loading.add(resource.url);

    try {
      if (resource.type === 'image') {
        await this.loadImage(resource.url);
      } else if (resource.type === 'video') {
        await this.preloadVideo(resource.url);
      } else if (resource.type === 'data') {
        await this.fetchData(resource.url);
      }

      this.loaded.add(resource.url);
    } catch (error) {
      console.error('Failed to load resource:', resource.url);
    } finally {
      this.loading.delete(resource.url);
    }
  }

  /**
   * Load image
   */
  loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });
  }

  /**
   * Preload video
   */
  preloadVideo(url) {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => resolve();
      video.onerror = () => resolve(); // Don't fail on video errors
      video.src = url;
    });
  }

  /**
   * Fetch data
   */
  async fetchData(url) {
    const response = await fetch(url);
    return response.json();
  }

  /**
   * Mark as loaded
   */
  markLoaded(url) {
    this.loaded.add(url);
    this.loading.delete(url);
  }

  /**
   * Is loaded
   */
  isLoaded(url) {
    return this.loaded.has(url);
  }

  /**
   * Is loading
   */
  isLoading(url) {
    return this.loading.has(url);
  }

  /**
   * Clear all
   */
  clear() {
    this.priorities = {
      critical: [],
      high: [],
      medium: [],
      low: []
    };
    this.loaded.clear();
    this.loading.clear();
  }
}

export default new ResourcePrioritization();