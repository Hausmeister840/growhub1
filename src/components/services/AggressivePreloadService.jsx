/**
 * Aggressive Preload Service
 * Preloads images, videos, and data in the background
 */

class AggressivePreloadService {
  constructor() {
    this.preloadedImages = new Set();
    this.preloadedVideos = new Set();
    this.preloadQueue = [];
    this.isProcessing = false;
    this.maxConcurrent = 3;
    this.currentLoading = 0;
  }

  /**
   * Preload image
   */
  preloadImage(src) {
    if (!src || this.preloadedImages.has(src)) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.preloadedImages.add(src);
        resolve(src);
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to preload image: ${src}`));
      };
      
      img.src = src;
    });
  }

  /**
   * Preload video metadata
   */
  preloadVideo(src) {
    if (!src || this.preloadedVideos.has(src)) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.addEventListener('loadedmetadata', () => {
        this.preloadedVideos.add(src);
        resolve(src);
      });
      
      video.addEventListener('error', () => {
        reject(new Error(`Failed to preload video: ${src}`));
      });
      
      video.src = src;
    });
  }

  /**
   * Preload post media
   */
  async preloadPostMedia(posts, startIndex = 0, count = 5) {
    const postsToPreload = posts.slice(startIndex, startIndex + count);
    
    for (const post of postsToPreload) {
      if (!post?.media_urls?.length) continue;

      for (const url of post.media_urls) {
        if (!url) continue;

        const isVideo = /\.(mp4|webm|mov)($|\?)/i.test(url);
        
        if (isVideo) {
          this.addToQueue(() => this.preloadVideo(url));
        } else {
          this.addToQueue(() => this.preloadImage(url));
        }
      }
    }

    this.processQueue();
  }

  /**
   * Add to preload queue
   */
  addToQueue(task) {
    this.preloadQueue.push(task);
  }

  /**
   * Process preload queue
   */
  async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.preloadQueue.length > 0) {
      if (this.currentLoading >= this.maxConcurrent) {
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }

      const task = this.preloadQueue.shift();
      if (task) {
        this.currentLoading++;
        
        task()
          .catch(() => {}) // Ignore errors
          .finally(() => {
            this.currentLoading--;
          });
      }
    }

    this.isProcessing = false;
  }

  /**
   * Preload user avatars
   */
  async preloadAvatars(users) {
    const avatarUrls = users
      .filter(u => u?.avatar_url)
      .map(u => u.avatar_url);

    for (const url of avatarUrls) {
      this.addToQueue(() => this.preloadImage(url));
    }

    this.processQueue();
  }

  /**
   * Check if image is preloaded
   */
  isImagePreloaded(src) {
    return this.preloadedImages.has(src);
  }

  /**
   * Check if video is preloaded
   */
  isVideoPreloaded(src) {
    return this.preloadedVideos.has(src);
  }

  /**
   * Clear preload cache
   */
  clear() {
    this.preloadedImages.clear();
    this.preloadedVideos.clear();
    this.preloadQueue = [];
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      preloadedImages: this.preloadedImages.size,
      preloadedVideos: this.preloadedVideos.size,
      queueLength: this.preloadQueue.length,
      currentLoading: this.currentLoading
    };
  }
}

export default new AggressivePreloadService();