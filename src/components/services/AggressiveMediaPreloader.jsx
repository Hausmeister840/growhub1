/**
 * 🚀 AGGRESSIVER MEDIA PRELOADER - Facebook-Style v2
 * - Initial Batch Preload (erste 10 Posts sofort)
 * - Blur Thumbnails (sofortige Vorschau)
 * - Intelligente Priorisierung
 */

class AggressiveMediaPreloader {
  constructor() {
    this.cache = new Map();
    this.thumbnailCache = new Map();
    this.preloadQueue = [];
    this.isPreloading = false;
    this.networkSpeed = 'fast';
    this.maxConcurrent = 8;
    this.currentPreloads = 0;
    this.initialBatchLoaded = false;
    
    this.detectNetwork();
    this.startPreloadWorker();
  }

  detectNetwork() {
    if (typeof navigator === 'undefined') return;
    
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      const type = connection.effectiveType;
      
      if (type === '4g') {
        this.networkSpeed = 'fast';
        this.maxConcurrent = 12; // Noch aggressiver
      } else if (type === '3g') {
        this.networkSpeed = 'medium';
        this.maxConcurrent = 6;
      } else {
        this.networkSpeed = 'slow';
        this.maxConcurrent = 3;
      }
      
      connection.addEventListener('change', () => this.detectNetwork());
    }
  }

  getPreloadDistance() {
    switch (this.networkSpeed) {
      case 'fast': return 10; // 🚀 10 Posts voraus!
      case 'medium': return 6;
      case 'slow': return 3;
      default: return 6;
    }
  }

  // 🚀 INITIAL BATCH: Lade erste 10 Posts SOFORT
  async preloadInitialBatch(posts) {
    if (this.initialBatchLoaded || !Array.isArray(posts) || posts.length === 0) return;
    
    this.initialBatchLoaded = true;
    const batchSize = Math.min(10, posts.length);
    
    console.log(`🚀 [Preloader] INITIAL BATCH: Loading first ${batchSize} posts`);

    // Parallel loading für maximale Geschwindigkeit
    const batchPromises = posts.slice(0, batchSize).map(async (post, idx) => {
      if (!post?.media_urls || post.media_urls.length === 0) return;
      
      // Erste 3 Posts: Höchste Priorität
      const priority = idx < 3 ? 'critical' : 'high';
      await this.preloadPostMedia(post, priority);
    });

    await Promise.allSettled(batchPromises);
    console.log(`✅ [Preloader] Initial batch loaded!`);
  }

  async preloadPostsAhead(posts, currentIndex) {
    if (!Array.isArray(posts)) return;

    const distance = this.getPreloadDistance();
    const start = Math.max(0, currentIndex - 2);
    const end = Math.min(posts.length, currentIndex + distance);

    for (let i = start; i < end; i++) {
      const post = posts[i];
      if (!post || !post.media_urls || post.media_urls.length === 0) continue;

      // Priorität basierend auf Distanz
      let priority = 'normal';
      if (i === currentIndex) priority = 'critical';
      else if (i === currentIndex + 1) priority = 'high';
      
      await this.preloadPostMedia(post, priority);
    }
  }

  async preloadPostMedia(post, priority = 'normal') {
    if (!post?.media_urls || post.media_urls.length === 0) return;

    const postId = post.id;
    if (this.cache.has(postId)) return;

    const urls = Array.isArray(post.media_urls) ? post.media_urls : [post.media_urls];
    
    // Parallel loading aller Medien
    const promises = urls.map(url => this.preloadMedia(url, priority));

    try {
      await Promise.all(promises);
      this.cache.set(postId, true);
    } catch (error) {
      console.warn(`⚠️ Preload failed for post ${postId}`);
    }
  }

  async preloadMedia(url, priority = 'normal') {
    if (!url || typeof url !== 'string') return;
    if (this.cache.has(url)) return;

    // Rate limiting basierend auf Priorität
    const maxWait = priority === 'critical' ? 0 : priority === 'high' ? 50 : 200;
    
    while (this.currentPreloads >= this.maxConcurrent) {
      await new Promise(resolve => setTimeout(resolve, maxWait));
    }

    this.currentPreloads++;

    try {
      const isVideo = /\.(mp4|webm|mov)$/i.test(url);

      if (isVideo) {
        await this.preloadVideo(url, priority);
      } else {
        await this.preloadImage(url);
      }

      this.cache.set(url, true);
    } catch (error) {
      // Silent fail
    } finally {
      this.currentPreloads--;
    }
  }

  // 🖼️ BLUR THUMBNAIL: Generiere tiny Vorschau
  generateBlurThumbnail(url) {
    if (this.thumbnailCache.has(url)) {
      return this.thumbnailCache.get(url);
    }

    // Tiny version für sofortiges Laden (10x10px, stark komprimiert)
    const thumbUrl = this.getThumbnailUrl(url);
    this.thumbnailCache.set(url, thumbUrl);
    
    // Preload thumbnail
    const img = new Image();
    img.src = thumbUrl;
    
    return thumbUrl;
  }

  getThumbnailUrl(url) {
    // Falls CDN mit Resize unterstützt wird
    if (url.includes('supabase.co')) {
      return `${url}?width=20&quality=10`; // Tiny blur preview
    }
    return url; // Fallback
  }

  preloadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
      
      // Timeout nach 10s
      setTimeout(() => reject(new Error('Timeout')), 10000);
    });
  }

  preloadVideo(url, priority) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      
      // Bei Fast Network: Ganzes Video laden
      // Bei Slow: Nur Metadata
      video.preload = this.networkSpeed === 'fast' && priority === 'critical' ? 'auto' : 'metadata';
      video.muted = true;
      video.playsInline = true;
      
      video.addEventListener('loadedmetadata', resolve);
      video.addEventListener('error', reject);
      
      video.src = url;
      video.load();
      
      // Timeout
      setTimeout(() => reject(new Error('Timeout')), 15000);
    });
  }

  startPreloadWorker() {
    // Background worker
    setInterval(() => {
      if (this.preloadQueue.length > 0 && this.currentPreloads < this.maxConcurrent) {
        const { url, priority } = this.preloadQueue.shift();
        this.preloadMedia(url, priority);
      }
    }, 100);
  }

  queuePreload(url, priority = 'normal') {
    if (!this.cache.has(url)) {
      // Insert basierend auf Priorität
      if (priority === 'critical') {
        this.preloadQueue.unshift({ url, priority });
      } else {
        this.preloadQueue.push({ url, priority });
      }
    }
  }

  isLoaded(postIdOrUrl) {
    return this.cache.has(postIdOrUrl);
  }

  hasThumbnail(url) {
    return this.thumbnailCache.has(url);
  }

  getThumbnail(url) {
    return this.thumbnailCache.get(url);
  }

  clearCache() {
    this.cache.clear();
    this.thumbnailCache.clear();
    this.initialBatchLoaded = false;
    console.log('🗑️ Preload cache cleared');
  }

  getStats() {
    return {
      cached: this.cache.size,
      thumbnails: this.thumbnailCache.size,
      queued: this.preloadQueue.length,
      concurrent: this.currentPreloads,
      networkSpeed: this.networkSpeed,
      initialBatchLoaded: this.initialBatchLoaded
    };
  }
}

const preloader = new AggressiveMediaPreloader();

// Debug stats alle 10s (nur in Development)
if (typeof window !== 'undefined') {
  const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1');
  if (isDev) {
    setInterval(() => {
      const stats = preloader.getStats();
      console.log('📊 [Preloader Stats]', stats);
    }, 10000);
  }
}

export default preloader;