// Quantum-inspired predictive caching layer
class QuantumCacheLayer {
  constructor() {
    this.cache = new Map();
    this.predictions = new Map();
    this.hitRates = new Map();
  }

  // Store with probability-based expiry
  set(key, value, ttl = 300000, probability = 0.8) {
    const expiresAt = Date.now() + ttl;
    
    this.cache.set(key, {
      value,
      expiresAt,
      probability,
      lastAccessed: Date.now(),
      accessCount: 0
    });

    // Predict related content
    this.predictRelated(key, value);
  }

  // Get with adaptive TTL
  get(key) {
    const cached = this.cache.get(key);
    
    if (!cached) {
      this.recordMiss(key);
      return null;
    }

    // Check expiry with probability decay
    const age = Date.now() - (cached.expiresAt - 300000);
    const decayFactor = Math.exp(-age / 300000);
    
    if (Date.now() > cached.expiresAt && Math.random() > (cached.probability * decayFactor)) {
      this.cache.delete(key);
      this.recordMiss(key);
      return null;
    }

    // Update metadata
    cached.lastAccessed = Date.now();
    cached.accessCount++;
    
    this.recordHit(key);
    return cached.value;
  }

  // Predictive pre-caching
  predictRelated(key, value) {
    if (!value?.tags) return;

    // For posts with tags, predict user might view related posts
    const relatedKeys = value.tags.map(tag => `posts:tag:${tag}`);
    
    relatedKeys.forEach(relatedKey => {
      const existing = this.predictions.get(relatedKey) || 0;
      this.predictions.set(relatedKey, existing + 0.1);
    });
  }

  // Get prediction score for a key
  getPredictionScore(key) {
    return this.predictions.get(key) || 0;
  }

  // Record cache hit
  recordHit(key) {
    const hits = this.hitRates.get(key) || { hits: 0, misses: 0 };
    hits.hits++;
    this.hitRates.set(key, hits);
  }

  // Record cache miss
  recordMiss(key) {
    const hits = this.hitRates.get(key) || { hits: 0, misses: 0 };
    hits.misses++;
    this.hitRates.set(key, hits);
  }

  // Get cache analytics
  getAnalytics() {
    let totalHits = 0;
    let totalMisses = 0;

    this.hitRates.forEach(({ hits, misses }) => {
      totalHits += hits;
      totalMisses += misses;
    });

    const hitRate = totalHits / (totalHits + totalMisses) || 0;

    return {
      hitRate,
      totalHits,
      totalMisses,
      cacheSize: this.cache.size,
      predictions: this.predictions.size
    };
  }

  // Clean expired entries
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    this.cache.forEach((value, key) => {
      if (now > value.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    });

    return cleaned;
  }

  // Clear all
  clear() {
    this.cache.clear();
    this.predictions.clear();
    this.hitRates.clear();
  }
}

export const quantumCache = new QuantumCacheLayer();

// Auto-cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    quantumCache.cleanup();
  }, 300000);
}