/**
 * 💾 OFFLINE STORAGE SERVICE
 * Provides persistent offline storage for posts and user data
 * Uses IndexedDB for better performance and storage limits
 */

const DB_NAME = 'growhub_offline';
const DB_VERSION = 1;
const POSTS_STORE = 'posts';
const USERS_STORE = 'users';
const MAX_CACHED_POSTS = 100;
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

class OfflineStorageService {
  constructor() {
    this.db = null;
    this.initPromise = this.initDB();
  }

  // ✅ Initialize IndexedDB
  async initDB() {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        console.warn('IndexedDB not available');
        resolve(null);
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialized');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create posts store
        if (!db.objectStoreNames.contains(POSTS_STORE)) {
          const postsStore = db.createObjectStore(POSTS_STORE, { keyPath: 'id' });
          postsStore.createIndex('created_date', 'created_date', { unique: false });
          postsStore.createIndex('cached_at', 'cached_at', { unique: false });
        }

        // Create users store
        if (!db.objectStoreNames.contains(USERS_STORE)) {
          const usersStore = db.createObjectStore(USERS_STORE, { keyPath: 'email' });
          usersStore.createIndex('cached_at', 'cached_at', { unique: false });
        }

        console.log('✅ IndexedDB stores created');
      };
    });
  }

  // ✅ Save posts to offline cache
  async savePosts(posts) {
    try {
      await this.initPromise;
      if (!this.db) {
        console.warn('IndexedDB not available, using localStorage fallback');
        this._savePostsToLocalStorage(posts);
        return;
      }

      const transaction = this.db.transaction([POSTS_STORE], 'readwrite');
      const store = transaction.objectStore(POSTS_STORE);
      const now = Date.now();

      // ✅ Add cached_at timestamp
      const postsWithTimestamp = posts.map(post => ({
        ...post,
        cached_at: now
      }));

      // Clear old entries if we exceed limit
      const count = await this._getCount(POSTS_STORE);
      if (count > MAX_CACHED_POSTS) {
        await this._clearOldPosts();
      }

      // Save new posts
      for (const post of postsWithTimestamp) {
        store.put(post);
      }

      await new Promise((resolve, reject) => {
        transaction.oncomplete = resolve;
        transaction.onerror = reject;
      });

      console.log(`💾 Saved ${posts.length} posts to IndexedDB`);
    } catch (error) {
      console.error('Error saving posts to IndexedDB:', error);
      this._savePostsToLocalStorage(posts);
    }
  }

  // ✅ Load posts from offline cache
  async loadPosts() {
    try {
      await this.initPromise;
      if (!this.db) {
        console.warn('IndexedDB not available, using localStorage fallback');
        return this._loadPostsFromLocalStorage();
      }

      const transaction = this.db.transaction([POSTS_STORE], 'readonly');
      const store = transaction.objectStore(POSTS_STORE);
      const index = store.index('created_date');
      
      const request = index.openCursor(null, 'prev'); // Newest first
      const posts = [];
      const now = Date.now();

      return new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor && posts.length < MAX_CACHED_POSTS) {
            const post = cursor.value;
            
            // ✅ Check if cache is still valid
            if (now - post.cached_at < CACHE_EXPIRY) {
              // Remove cached_at before returning
              const { cached_at, ...postData } = post;
              posts.push(postData);
            }
            
            cursor.continue();
          } else {
            console.log(`📱 Loaded ${posts.length} posts from IndexedDB`);
            resolve(posts);
          }
        };

        request.onerror = () => {
          console.error('Error loading posts from IndexedDB:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Error loading posts:', error);
      return this._loadPostsFromLocalStorage();
    }
  }

  // ✅ Save user data
  async saveUser(user) {
    try {
      await this.initPromise;
      if (!this.db) return;

      const transaction = this.db.transaction([USERS_STORE], 'readwrite');
      const store = transaction.objectStore(USERS_STORE);
      
      store.put({
        ...user,
        cached_at: Date.now()
      });

      await new Promise((resolve, reject) => {
        transaction.oncomplete = resolve;
        transaction.onerror = reject;
      });
    } catch (error) {
      console.error('Error saving user:', error);
    }
  }

  // ✅ Get user data
  async getUser(email) {
    try {
      await this.initPromise;
      if (!this.db) return null;

      const transaction = this.db.transaction([USERS_STORE], 'readonly');
      const store = transaction.objectStore(USERS_STORE);
      
      return new Promise((resolve, reject) => {
        const request = store.get(email);
        
        request.onsuccess = () => {
          const user = request.result;
          if (user && Date.now() - user.cached_at < CACHE_EXPIRY) {
            const { cached_at, ...userData } = user;
            resolve(userData);
          } else {
            resolve(null);
          }
        };
        
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  // ✅ Clear old posts
  async _clearOldPosts() {
    try {
      const transaction = this.db.transaction([POSTS_STORE], 'readwrite');
      const store = transaction.objectStore(POSTS_STORE);
      const index = store.index('cached_at');
      
      const request = index.openCursor();
      let deleteCount = 0;
      const maxToKeep = Math.floor(MAX_CACHED_POSTS * 0.75);

      return new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor && deleteCount < MAX_CACHED_POSTS - maxToKeep) {
            cursor.delete();
            deleteCount++;
            cursor.continue();
          } else {
            console.log(`🗑️ Cleared ${deleteCount} old posts`);
            resolve();
          }
        };
        
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error clearing old posts:', error);
    }
  }

  // ✅ Get count of items in store
  async _getCount(storeName) {
    try {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error getting count:', error);
      return 0;
    }
  }

  // ✅ LocalStorage fallback methods
  _savePostsToLocalStorage(posts) {
    try {
      const cached = {
        posts: posts.slice(0, 50), // Limit to 50 for localStorage
        timestamp: Date.now()
      };
      localStorage.setItem('growhub_cached_posts', JSON.stringify(cached));
      console.log('💾 Saved posts to localStorage');
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  _loadPostsFromLocalStorage() {
    try {
      const cached = localStorage.getItem('growhub_cached_posts');
      if (!cached) return [];

      const { posts, timestamp } = JSON.parse(cached);
      
      // Check if cache is still valid
      if (Date.now() - timestamp < CACHE_EXPIRY) {
        console.log('📱 Loaded posts from localStorage');
        return posts;
      }
      
      // Clear expired cache
      localStorage.removeItem('growhub_cached_posts');
      return [];
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return [];
    }
  }

  // ✅ Clear all offline data
  async clearAll() {
    try {
      await this.initPromise;
      if (!this.db) {
        localStorage.removeItem('growhub_cached_posts');
        return;
      }

      const transaction = this.db.transaction([POSTS_STORE, USERS_STORE], 'readwrite');
      transaction.objectStore(POSTS_STORE).clear();
      transaction.objectStore(USERS_STORE).clear();

      await new Promise((resolve, reject) => {
        transaction.oncomplete = resolve;
        transaction.onerror = reject;
      });

      console.log('🗑️ Cleared all offline data');
    } catch (error) {
      console.error('Error clearing offline data:', error);
    }
  }
}

// Export singleton instance
export const OfflineStorage = new OfflineStorageService();