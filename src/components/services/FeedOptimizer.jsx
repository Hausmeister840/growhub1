/**
 * 🎯 FEED OPTIMIZER SERVICE
 * Client-side Helfer für optimalen Feed-Performance
 */

class FeedOptimizer {
  constructor() {
    this.prefetchQueue = new Map();
    this.loadedTabs = new Set();
    this.networkQuality = 'unknown';
    
    this.detectNetworkQuality();
  }

  // ✅ Network Quality Detection
  detectNetworkQuality() {
    if (navigator.connection) {
      const connection = navigator.connection;
      this.networkQuality = connection.effectiveType || 'unknown';
      
      connection.addEventListener('change', () => {
        this.networkQuality = connection.effectiveType || 'unknown';
        console.log('📶 Network quality changed:', this.networkQuality);
      });
    }
  }

  // ✅ Sollte Tab vorgel aden werden?
  shouldPrefetchTab(tabName) {
    // Nur bei guter Verbindung prefetchen
    if (this.networkQuality === '2g' || this.networkQuality === 'slow-2g') {
      return false;
    }
    
    // Nicht bereits geladene Tabs
    return !this.loadedTabs.has(tabName);
  }

  // ✅ Tab als geladen markieren
  markTabLoaded(tabName) {
    this.loadedTabs.add(tabName);
  }

  // ✅ Optimale Batch-Size basierend auf Network
  getOptimalBatchSize() {
    switch (this.networkQuality) {
      case '4g':
        return 30;
      case '3g':
        return 20;
      case '2g':
        return 10;
      default:
        return 20;
    }
  }

  // ✅ Sollten Bilder geladen werden?
  shouldLoadImages() {
    if (this.networkQuality === '2g' || this.networkQuality === 'slow-2g') {
      return false;
    }
    return true;
  }

  // ✅ Video-Qualität
  getOptimalVideoQuality() {
    switch (this.networkQuality) {
      case '4g':
        return 'high';
      case '3g':
        return 'medium';
      default:
        return 'low';
    }
  }

  // ✅ Reset Cache
  reset() {
    this.prefetchQueue.clear();
    this.loadedTabs.clear();
  }
}

export const feedOptimizer = new FeedOptimizer();
export default feedOptimizer;