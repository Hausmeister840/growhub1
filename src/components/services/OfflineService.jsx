import { openDB } from 'idb';

const DB_NAME = 'growhub-offline';
const DB_VERSION = 1;

class OfflineService {
  constructor() {
    this.db = null;
    this.init();
  }

  async init() {
    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Posts store
        if (!db.objectStoreNames.contains('posts')) {
          const postStore = db.createObjectStore('posts', { keyPath: 'id' });
          postStore.createIndex('timestamp', 'cached_at');
        }

        // Users store
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'email' });
        }

        // Pending actions (to sync when online)
        if (!db.objectStoreNames.contains('pending')) {
          const pendingStore = db.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
          pendingStore.createIndex('timestamp', 'created_at');
        }
      }
    });
  }

  async cachePosts(posts) {
    if (!this.db) await this.init();
    
    const tx = this.db.transaction('posts', 'readwrite');
    const now = Date.now();
    
    await Promise.all(
      posts.map(post => 
        tx.store.put({ ...post, cached_at: now })
      )
    );
  }

  async getCachedPosts() {
    if (!this.db) await this.init();
    return await this.db.getAll('posts');
  }

  async cacheUsers(users) {
    if (!this.db) await this.init();
    
    const tx = this.db.transaction('users', 'readwrite');
    await Promise.all(
      Object.values(users).map(user => tx.store.put(user))
    );
  }

  async getCachedUsers() {
    if (!this.db) await this.init();
    const users = await this.db.getAll('users');
    return users.reduce((acc, user) => {
      acc[user.email] = user;
      return acc;
    }, {});
  }

  async addPendingAction(action) {
    if (!this.db) await this.init();
    
    await this.db.add('pending', {
      ...action,
      created_at: Date.now()
    });
  }

  async getPendingActions() {
    if (!this.db) await this.init();
    return await this.db.getAll('pending');
  }

  async clearPendingAction(id) {
    if (!this.db) await this.init();
    await this.db.delete('pending', id);
  }

  async syncPendingActions(syncFn) {
    const pending = await this.getPendingActions();
    
    for (const action of pending) {
      try {
        await syncFn(action);
        await this.clearPendingAction(action.id);
      } catch (error) {
        console.error('Sync error:', error);
      }
    }
  }

  async clearOldCache() {
    if (!this.db) await this.init();
    
    const oneDay = 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - oneDay;
    
    const tx = this.db.transaction('posts', 'readwrite');
    const index = tx.store.index('timestamp');
    const range = IDBKeyRange.upperBound(cutoff);
    
    let cursor = await index.openCursor(range);
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
  }
}

export default new OfflineService();