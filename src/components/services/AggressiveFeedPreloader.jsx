/**
 * 🚀 AGGRESSIVE FEED PRELOADER
 * Instagram-Level: Preload 3-5 Posts ahead, Images + Videos, User Data
 */

import { preloadImage, preloadVideo, isVideoUrl } from '../utils/media';

class AggressiveFeedPreloader {
  constructor() {
    this.preloadCache = new Map();
    this.preloadQueue = [];
    this.isPreloading = false;
    this.maxConcurrent = 3;
    this.activePreloads = 0;
    this.PRELOAD_AHEAD = 5; // Posts vorausladen
  }

  /**
   * Starte aggressives Preloading ab dem aktuellen Index
   */
  preloadFeed(posts, currentIndex, users) {
    if (!posts || posts.length === 0) return;

    // Lösche alte Cache-Einträge (älter als 2 Minuten)
    this.cleanOldCache();

    // Berechne Range zum Preloaden
    const start = Math.max(0, currentIndex);
    const end = Math.min(posts.length, currentIndex + this.PRELOAD_AHEAD);

    const postsToPreload = posts.slice(start, end);

    postsToPreload.forEach((post, idx) => {
      const priority = idx; // Näher am Current = höhere Priorität
      this.queuePostPreload(post, users, priority);
    });

    this.processQueue();
  }

  /**
   * Queue einen Post zum Preloaden
   */
  queuePostPreload(post, users, priority = 5) {
    if (!post || !post.id) return;

    // Bereits im Cache oder Queue?
    if (this.preloadCache.has(post.id)) return;
    if (this.preloadQueue.some(item => item.postId === post.id)) return;

    const mediaUrls = post.media_urls || [];
    const userEmail = post.created_by;
    const user = users?.[userEmail];

    const tasks = [];

    // 1. User Avatar preloaden
    if (user?.avatar_url) {
      tasks.push({
        type: 'image',
        url: user.avatar_url,
        priority: priority - 0.5 // Avatar höhere Priorität
      });
    }

    // 2. Post Media preloaden
    mediaUrls.forEach((url, idx) => {
      if (!url) return;
      
      tasks.push({
        type: isVideoUrl(url) ? 'video' : 'image',
        url,
        priority: priority + idx * 0.1 // Erstes Bild wichtiger
      });
    });

    if (tasks.length > 0) {
      this.preloadQueue.push({
        postId: post.id,
        tasks,
        priority
      });

      // Queue nach Priorität sortieren
      this.preloadQueue.sort((a, b) => a.priority - b.priority);
    }
  }

  /**
   * Verarbeite die Preload Queue
   */
  async processQueue() {
    if (this.isPreloading) return;
    if (this.preloadQueue.length === 0) return;

    this.isPreloading = true;

    while (this.preloadQueue.length > 0 && this.activePreloads < this.maxConcurrent) {
      const item = this.preloadQueue.shift();
      this.activePreloads++;

      this.preloadPostTasks(item)
        .then(() => {
          this.preloadCache.set(item.postId, {
            timestamp: Date.now(),
            success: true
          });
        })
        .catch(err => {
          console.warn('Preload failed:', err);
        })
        .finally(() => {
          this.activePreloads--;
          if (this.preloadQueue.length > 0) {
            this.processQueue();
          } else if (this.activePreloads === 0) {
            this.isPreloading = false;
          }
        });
    }
    
    // Reset flag wenn keine Items mehr zu verarbeiten sind
    if (this.preloadQueue.length === 0 && this.activePreloads === 0) {
      this.isPreloading = false;
    }
  }

  /**
   * Preload alle Tasks für einen Post
   */
  async preloadPostTasks(item) {
    const { tasks } = item;

    const promises = tasks.map(task => {
      if (task.type === 'image') {
        return preloadImage(task.url).catch(() => null);
      } else if (task.type === 'video') {
        return preloadVideo(task.url).catch(() => null);
      }
      return Promise.resolve();
    });

    await Promise.allSettled(promises);
  }

  /**
   * Lösche alte Cache-Einträge
   */
  cleanOldCache() {
    const MAX_AGE = 2 * 60 * 1000; // 2 Minuten
    const now = Date.now();

    for (const [key, value] of this.preloadCache.entries()) {
      if (now - value.timestamp > MAX_AGE) {
        this.preloadCache.delete(key);
      }
    }
  }

  /**
   * Prüfe ob Post preloaded ist
   */
  isPreloaded(postId) {
    return this.preloadCache.has(postId);
  }

  /**
   * Lösche gesamten Cache
   */
  clearCache() {
    this.preloadCache.clear();
    this.preloadQueue = [];
  }

  /**
   * Preload User-spezifische Daten (Avatar, etc.)
   */
  preloadUser(user) {
    if (!user?.avatar_url) return;
    
    preloadImage(user.avatar_url).catch(() => null);
  }

  /**
   * Emergency: Stoppe alle Preloads (z.B. bei Low Battery)
   */
  pausePreloading() {
    this.preloadQueue = [];
    this.isPreloading = false;
  }

  /**
   * Setze Preload-Aggressivität basierend auf Connection
   */
  adjustForConnection(connectionType) {
    switch (connectionType) {
      case '4g':
      case 'wifi':
        this.PRELOAD_AHEAD = 5;
        this.maxConcurrent = 3;
        break;
      case '3g':
        this.PRELOAD_AHEAD = 3;
        this.maxConcurrent = 2;
        break;
      case '2g':
      case 'slow-2g':
        this.PRELOAD_AHEAD = 1;
        this.maxConcurrent = 1;
        break;
      default:
        this.PRELOAD_AHEAD = 3;
        this.maxConcurrent = 2;
    }
  }
}

export default new AggressiveFeedPreloader();