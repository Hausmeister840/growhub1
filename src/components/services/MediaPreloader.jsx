/**
 * 📦 AGGRESSIVER MEDIA PRELOADER
 * Lädt Bilder und Videos im Voraus, um sofortiges Anzeigen zu gewährleisten
 * Adaptiv basierend auf Netzwerkqualität
 */

class MediaPreloaderService {
  constructor() {
    this.preloadedMedia = new Map();
    this.preloadQueue = [];
    this.isPreloading = false;
    this.networkSpeed = 'fast'; // 'fast', 'medium', 'slow'
    this.maxConcurrentPreloads = 3;
    this.currentPreloads = 0;
    
    this.detectNetworkSpeed();
  }

  /**
   * Erkennt Netzwerkgeschwindigkeit
   */
  detectNetworkSpeed() {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      if (connection) {
        const effectiveType = connection.effectiveType;
        
        if (effectiveType === '4g') {
          this.networkSpeed = 'fast';
          this.maxConcurrentPreloads = 5;
        } else if (effectiveType === '3g') {
          this.networkSpeed = 'medium';
          this.maxConcurrentPreloads = 3;
        } else {
          this.networkSpeed = 'slow';
          this.maxConcurrentPreloads = 1;
        }
        
        console.log(`📡 Network speed detected: ${this.networkSpeed} (${effectiveType})`);
        
        // Listen for changes
        connection.addEventListener('change', () => {
          this.detectNetworkSpeed();
        });
      }
    }
  }

  /**
   * Bestimmt wie viele Posts vorgeladen werden sollen
   */
  getPreloadDistance() {
    switch (this.networkSpeed) {
      case 'fast': return 3; // 3 Posts voraus
      case 'medium': return 2; // 2 Posts voraus
      case 'slow': return 1; // 1 Post voraus
      default: return 2;
    }
  }

  /**
   * Preload Media für einen einzelnen Post
   */
  async preloadPostMedia(post, priority = 'normal') {
    if (!post || !post.media_urls || post.media_urls.length === 0) {
      return;
    }

    const postId = post.id;
    
    // Bereits preloaded?
    if (this.preloadedMedia.has(postId)) {
      return this.preloadedMedia.get(postId);
    }

    const mediaUrls = Array.isArray(post.media_urls) ? post.media_urls : [post.media_urls];
    const promises = mediaUrls.map(url => this.preloadSingleMedia(url, priority));

    try {
      await Promise.all(promises);
      this.preloadedMedia.set(postId, true);
      console.log(`✅ Preloaded media for post ${postId}`);
    } catch (error) {
      console.warn(`⚠️ Failed to preload some media for post ${postId}:`, error);
    }
  }

  /**
   * Preload einzelnes Medium (Bild oder Video)
   */
  async preloadSingleMedia(url, priority = 'normal') {
    if (!url || typeof url !== 'string') return;

    return new Promise((resolve, reject) => {
      const isVideo = /\.(mp4|webm|mov|avi|m4v)$/i.test(url);

      if (isVideo) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = url;
        
        video.addEventListener('loadedmetadata', () => {
          console.log(`🎥 Video preloaded: ${url.substring(0, 50)}...`);
          resolve();
        });
        
        video.addEventListener('error', (e) => {
          console.warn(`⚠️ Video preload failed: ${url}`, e);
          reject(e);
        });
        
      } else {
        const img = new Image();
        
        img.onload = () => {
          console.log(`🖼️ Image preloaded: ${url.substring(0, 50)}...`);
          resolve();
        };
        
        img.onerror = (e) => {
          console.warn(`⚠️ Image preload failed: ${url}`, e);
          reject(e);
        };
        
        img.src = url;
      }
    });
  }

  /**
   * Preload für mehrere Posts (Feed-optimiert)
   */
  async preloadFeedMedia(posts, currentIndex = 0) {
    if (!Array.isArray(posts) || posts.length === 0) return;

    const distance = this.getPreloadDistance();
    const endIndex = Math.min(currentIndex + distance, posts.length);

    console.log(`📦 Preloading posts ${currentIndex} to ${endIndex} (distance: ${distance})`);

    const preloadPromises = [];
    
    for (let i = currentIndex; i < endIndex; i++) {
      const post = posts[i];
      if (post) {
        const priority = i === currentIndex ? 'high' : 'normal';
        preloadPromises.push(this.preloadPostMedia(post, priority));
      }
    }

    try {
      await Promise.all(preloadPromises);
    } catch (error) {
      console.warn('⚠️ Some media failed to preload:', error);
    }
  }

  /**
   * Clear Cache (z.B. bei Tab-Wechsel)
   */
  clearCache() {
    this.preloadedMedia.clear();
    console.log('🗑️ Media preload cache cleared');
  }

  /**
   * Check ob Post bereits preloaded ist
   */
  isPreloaded(postId) {
    return this.preloadedMedia.has(postId);
  }
}

// Singleton Instance
export const mediaPreloader = new MediaPreloaderService();

export default mediaPreloader;