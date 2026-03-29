/**
 * 🚀 ADVANCED FEED CACHE - Optimierte Performance
 * - Multi-Layer Cache (Memory + IndexedDB)
 * - TTL-basierte Invalidierung
 * - Automatische Bereinigung
 * - Prefetching Support
 */

const CACHE_VERSION = 'v2';
const MEMORY_TTL = 30000; // 30 Sekunden
const DB_TTL = 300000; // 5 Minuten
const MAX_MEMORY_ITEMS = 100;

class FeedCache {
  constructor() {
    this.memory = new Map();
    this.db = null;
    this.initDB();
  }

  async initDB() {
    if (!('indexedDB' in window)) {
      console.warn('IndexedDB not supported');
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open('GrowHubFeedCache', 1);

      request.onerror = () => {
        console.error('IndexedDB error');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ Feed cache DB ready');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('feed')) {
          db.createObjectStore('feed', { keyPath: 'key' });
        }
      };
    });
  }

  getCacheKey(tab, page = 0) {
    return `${CACHE_VERSION}_${tab}_${page}`;
  }

  // ✅ GET from Memory Cache (fastest)
  getFromMemory(key) {
    const cached = this.memory.get(key);
    
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > MEMORY_TTL) {
      this.memory.delete(key);
      return null;
    }

    console.log(`📦 [Cache] Memory hit: ${key}, age: ${age}ms`);
    return cached.data;
  }

  // ✅ SET in Memory Cache
  setInMemory(key, data) {
    // Limit memory cache size
    if (this.memory.size >= MAX_MEMORY_ITEMS) {
      const firstKey = this.memory.keys().next().value;
      this.memory.delete(firstKey);
    }

    this.memory.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // ✅ GET from IndexedDB
  async getFromDB(key) {
    if (!this.db) return null;

    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction(['feed'], 'readonly');
        const store = transaction.objectStore('feed');
        const request = store.get(key);

        request.onsuccess = () => {
          const cached = request.result;
          
          if (!cached) {
            resolve(null);
            return;
          }

          const age = Date.now() - cached.timestamp;
          if (age > DB_TTL) {
            this.removeFromDB(key);
            resolve(null);
            return;
          }

          console.log(`💾 [Cache] DB hit: ${key}, age: ${age}ms`);
          
          // Populate memory cache
          this.setInMemory(key, cached.data);
          
          resolve(cached.data);
        };

        request.onerror = () => {
          console.error('IndexedDB read error');
          resolve(null);
        };
      } catch (error) {
        console.error('IndexedDB transaction error:', error);
        resolve(null);
      }
    });
  }

  // ✅ SET in IndexedDB
  async setInDB(key, data) {
    if (!this.db) return;

    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction(['feed'], 'readwrite');
        const store = transaction.objectStore('feed');

        store.put({
          key,
          data,
          timestamp: Date.now()
        });

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => {
          console.error('IndexedDB write error');
          resolve();
        };
      } catch (error) {
        console.error('IndexedDB transaction error:', error);
        resolve();
      }
    });
  }

  // ✅ REMOVE from IndexedDB
  async removeFromDB(key) {
    if (!this.db) return;

    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction(['feed'], 'readwrite');
        const store = transaction.objectStore('feed');
        store.delete(key);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => resolve();
      } catch (error) {
        resolve();
      }
    });
  }

  // ✅ PUBLIC: GET (checks both layers)
  async get(tab, page = 0) {
    const key = this.getCacheKey(tab, page);

    // Try memory first
    const memoryData = this.getFromMemory(key);
    if (memoryData) return memoryData;

    // Try IndexedDB
    const dbData = await this.getFromDB(key);
    return dbData;
  }

  // ✅ PUBLIC: SET (stores in both layers)
  async set(tab, page = 0, data) {
    const key = this.getCacheKey(tab, page);

    // Store in memory
    this.setInMemory(key, data);

    // Store in IndexedDB
    await this.setInDB(key, data);

    console.log(`✅ [Cache] Stored: ${key}`);
  }

  // ✅ PUBLIC: INVALIDATE
  async invalidate(tab = null) {
    if (tab) {
      // Invalidate specific tab
      const pattern = `${CACHE_VERSION}_${tab}_`;
      
      // Clear memory
      for (const key of this.memory.keys()) {
        if (key.startsWith(pattern)) {
          this.memory.delete(key);
        }
      }

      // Clear IndexedDB
      if (this.db) {
        try {
          const transaction = this.db.transaction(['feed'], 'readwrite');
          const store = transaction.objectStore('feed');
          const request = store.openCursor();

          request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
              if (cursor.key.startsWith(pattern)) {
                cursor.delete();
              }
              cursor.continue();
            }
          };
        } catch (error) {
          console.error('Cache invalidation error:', error);
        }
      }

      console.log(`🗑️ [Cache] Invalidated: ${tab}`);
    } else {
      // Clear all
      this.memory.clear();
      
      if (this.db) {
        try {
          const transaction = this.db.transaction(['feed'], 'readwrite');
          const store = transaction.objectStore('feed');
          store.clear();
        } catch (error) {
          console.error('Cache clear error:', error);
        }
      }

      console.log('🗑️ [Cache] Cleared all');
    }
  }

  // ✅ PUBLIC: PREFETCH
  async prefetch(tab, currentPage) {
    const nextPage = currentPage + 1;
    const key = this.getCacheKey(tab, nextPage);

    // Check if already cached
    const exists = this.getFromMemory(key) || await this.getFromDB(key);
    if (exists) {
      console.log(`⏭️ [Cache] Prefetch skipped (already cached): ${key}`);
      return;
    }

    console.log(`⏭️ [Cache] Prefetch ready for: ${key}`);
    // Actual prefetching logic would be in useFeed
  }

  // ✅ PUBLIC: CLEANUP (remove expired entries)
  async cleanup() {
    if (!this.db) return;

    console.log('🧹 [Cache] Cleanup started');

    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction(['feed'], 'readwrite');
        const store = transaction.objectStore('feed');
        const request = store.openCursor();

        let removed = 0;

        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            const age = Date.now() - cursor.value.timestamp;
            if (age > DB_TTL) {
              cursor.delete();
              removed++;
            }
            cursor.continue();
          }
        };

        transaction.oncomplete = () => {
          console.log(`🧹 [Cache] Cleanup done, removed ${removed} entries`);
          resolve();
        };

        transaction.onerror = () => resolve();
      } catch (error) {
        console.error('Cleanup error:', error);
        resolve();
      }
    });
  }
}

// Singleton instance
const feedCache = new FeedCache();

// Auto-cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    feedCache.cleanup();
  }, 300000);
}

export default feedCache;