// Enhanced client-side caching utilities

const CACHE_PREFIX = 'growhub_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * 💾 ENHANCED CACHE UTILITY
 * Besseres Caching mit Compression und TTL
 */

// Check if storage is available
const isStorageAvailable = (type) => {
  try {
    const storage = window[type];
    const test = '__storage_test__';
    storage.setItem(test, test);
    storage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

const hasLocalStorage = isStorageAvailable('localStorage');
const hasSessionStorage = isStorageAvailable('sessionStorage');

// Simple LRU memory cache fallback
class MemoryCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  get(key) {
    return this.cache.get(key);
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

const memoryCache = new MemoryCache(100);

/**
 * Set cache with TTL
 */
export const setCache = (key, value, ttl = DEFAULT_TTL, useSession = false) => {
  const cacheKey = CACHE_PREFIX + key;
  const cacheData = {
    value,
    timestamp: Date.now(),
    ttl
  };

  try {
    const serialized = JSON.stringify(cacheData);
    
    if (useSession && hasSessionStorage) {
      sessionStorage.setItem(cacheKey, serialized);
    } else if (hasLocalStorage) {
      localStorage.setItem(cacheKey, serialized);
    } else {
      memoryCache.set(cacheKey, cacheData);
    }
  } catch (error) {
    console.warn('Cache set failed:', error);
    // Fallback to memory
    memoryCache.set(cacheKey, cacheData);
  }
};

/**
 * Get cache with TTL check
 */
export const getCache = (key, useSession = false) => {
  const cacheKey = CACHE_PREFIX + key;

  try {
    let serialized;
    
    if (useSession && hasSessionStorage) {
      serialized = sessionStorage.getItem(cacheKey);
    } else if (hasLocalStorage) {
      serialized = localStorage.getItem(cacheKey);
    } else {
      const memData = memoryCache.get(cacheKey);
      if (memData) {
        const isExpired = Date.now() - memData.timestamp > memData.ttl;
        return isExpired ? null : memData.value;
      }
      return null;
    }

    if (!serialized) return null;

    const cacheData = JSON.parse(serialized);
    const isExpired = Date.now() - cacheData.timestamp > cacheData.ttl;

    if (isExpired) {
      deleteCache(key, useSession);
      return null;
    }

    return cacheData.value;
  } catch (error) {
    console.warn('Cache get failed:', error);
    return null;
  }
};

/**
 * Delete specific cache
 */
export const deleteCache = (key, useSession = false) => {
  const cacheKey = CACHE_PREFIX + key;

  try {
    if (useSession && hasSessionStorage) {
      sessionStorage.removeItem(cacheKey);
    } else if (hasLocalStorage) {
      localStorage.removeItem(cacheKey);
    } else {
      memoryCache.delete(cacheKey);
    }
  } catch (error) {
    console.warn('Cache delete failed:', error);
  }
};

/**
 * Clear all cache
 */
export const clearAllCache = (useSession = false) => {
  try {
    if (useSession && hasSessionStorage) {
      sessionStorage.clear();
    } else if (hasLocalStorage) {
      localStorage.clear();
    } else {
      memoryCache.clear();
    }
  } catch (error) {
    console.warn('Cache clear failed:', error);
  }
};

/**
 * Get cache size
 */
export const getCacheSize = () => {
  try {
    if (!hasLocalStorage) return 0;
    
    let size = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key) && key.startsWith(CACHE_PREFIX)) {
        size += localStorage[key].length;
      }
    }
    return size;
  } catch (error) {
    return 0;
  }
};

/**
 * Clean expired cache
 */
export const cleanExpiredCache = () => {
  try {
    if (!hasLocalStorage) return;

    const now = Date.now();
    const keysToDelete = [];

    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key) && key.startsWith(CACHE_PREFIX)) {
        try {
          const cacheData = JSON.parse(localStorage[key]);
          if (now - cacheData.timestamp > cacheData.ttl) {
            keysToDelete.push(key);
          }
        } catch (e) {
          // Invalid JSON, delete it
          keysToDelete.push(key);
        }
      }
    }

    keysToDelete.forEach(key => localStorage.removeItem(key));
    
    console.log(`🧹 Cleaned ${keysToDelete.length} expired cache entries`);
  } catch (error) {
    console.warn('Cache cleanup failed:', error);
  }
};

// Auto-cleanup on app start
if (typeof window !== 'undefined') {
  cleanExpiredCache();
}

export default {
  set: setCache,
  get: getCache,
  delete: deleteCache,
  clear: clearAllCache,
  getSize: getCacheSize,
  cleanExpired: cleanExpiredCache
};