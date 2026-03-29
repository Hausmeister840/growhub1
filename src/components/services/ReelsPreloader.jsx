/**
 * Intelligentes Video-Preloading System
 * Lädt Videos voraus basierend auf Netzwerk und Device-Performance
 */

export class ReelsPreloader {
  constructor() {
    this.preloadQueue = [];
    this.loadedVideos = new Set();
    this.isPreloading = false;
    this.networkQuality = this.detectNetworkQuality();
    this.maxPreload = this.networkQuality === 'high' ? 3 : this.networkQuality === 'medium' ? 2 : 1;
    
    // Monitor network changes
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', () => {
        this.networkQuality = this.detectNetworkQuality();
        this.adjustPreloadStrategy();
      });
    }
  }

  detectNetworkQuality() {
    if (!('connection' in navigator)) return 'medium';
    
    const conn = navigator.connection;
    const effectiveType = conn.effectiveType;
    
    if (effectiveType === '4g' || effectiveType === 'wifi') {
      return 'high';
    } else if (effectiveType === '3g') {
      return 'medium';
    } else {
      return 'low';
    }
  }

  adjustPreloadStrategy() {
    this.maxPreload = this.networkQuality === 'high' ? 3 : 
                       this.networkQuality === 'medium' ? 2 : 1;
  }

  /**
   * Preload Videos basierend auf aktueller Position
   */
  preloadVideos(videos, currentIndex, videoRefs) {
    // Clear alte preloads
    this.cleanupOldPreloads(currentIndex);

    // Preload nächste Videos
    for (let i = 1; i <= this.maxPreload; i++) {
      const targetIndex = currentIndex + i;
      if (targetIndex < videos.length) {
        this.preloadVideo(videos[targetIndex], targetIndex, videoRefs);
      }
    }

    // Optional: Preload vorheriges Video für Zurück-Navigation
    if (currentIndex > 0 && this.networkQuality === 'high') {
      const prevIndex = currentIndex - 1;
      this.preloadVideo(videos[prevIndex], prevIndex, videoRefs);
    }
  }

  preloadVideo(video, index, videoRefs) {
    const videoElement = videoRefs.current[index];
    if (!videoElement) return;
    
    const videoUrl = video.media_urls?.find(url => /\.(mp4|webm|mov)($|\?)/i.test(url));
    if (!videoUrl || this.loadedVideos.has(videoUrl)) return;

    // Preload aktivieren
    videoElement.preload = 'auto';
    videoElement.load();
    
    this.loadedVideos.add(videoUrl);
  }

  cleanupOldPreloads(currentIndex) {
    // Entferne Videos die zu weit weg sind aus dem Cache
    const keepRange = this.maxPreload + 1;
    
    this.loadedVideos.forEach(url => {
      // Basic cleanup logic - in production würde man hier genauer prüfen
      if (Math.random() > 0.9) { // 10% chance to cleanup old videos
        this.loadedVideos.delete(url);
      }
    });
  }

  /**
   * Priorisiert kritische Preloads
   */
  prioritizePreload(videoIndex) {
    // Move to front of queue
    this.preloadQueue = [videoIndex, ...this.preloadQueue.filter(i => i !== videoIndex)];
  }

  /**
   * Reset für neue Session
   */
  reset() {
    this.preloadQueue = [];
    this.loadedVideos.clear();
    this.isPreloading = false;
  }

  /**
   * Gibt Status über Preload-Queue
   */
  getStatus() {
    return {
      queueLength: this.preloadQueue.length,
      loadedCount: this.loadedVideos.size,
      networkQuality: this.networkQuality,
      maxPreload: this.maxPreload
    };
  }
}

export default new ReelsPreloader();