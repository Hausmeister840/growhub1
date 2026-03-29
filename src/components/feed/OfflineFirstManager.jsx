// Offline-first architecture manager
class OfflineFirstManager {
  constructor() {
    this.db = null;
    this.syncQueue = [];
    this.isOnline = navigator.onLine;
    this.initDB();
    this.setupListeners();
  }

  async initDB() {
    if (!('indexedDB' in window)) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open('GrowHubOffline', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('posts')) {
          db.createObjectStore('posts', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('drafts')) {
          db.createObjectStore('drafts', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  setupListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingOperations();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // Store posts offline
  async storePosts(posts) {
    if (!this.db) return;

    const transaction = this.db.transaction(['posts'], 'readwrite');
    const store = transaction.objectStore('posts');

    posts.forEach(post => {
      store.put(post);
    });

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Get offline posts
  async getOfflinePosts() {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['posts'], 'readonly');
      const store = transaction.objectStore('posts');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Queue operation for sync
  async queueOperation(operation) {
    if (!this.db) return;

    const transaction = this.db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    
    await store.add({
      ...operation,
      timestamp: Date.now(),
      synced: false
    });

    this.syncQueue.push(operation);

    if (this.isOnline) {
      this.syncPendingOperations();
    }
  }

  // Sync pending operations
  async syncPendingOperations() {
    if (!this.db || this.syncQueue.length === 0) return;

    console.log(`Syncing ${this.syncQueue.length} operations...`);

    for (const operation of this.syncQueue) {
      try {
        // Execute the operation
        await this.executeOperation(operation);
        
        // Remove from queue
        this.syncQueue = this.syncQueue.filter(op => op.id !== operation.id);
      } catch (error) {
        console.error('Sync failed for operation:', operation, error);
      }
    }
  }

  async executeOperation(operation) {
    // Execute based on operation type
    switch (operation.type) {
      case 'create_post':
        // Call API to create post
        break;
      case 'update_post':
        // Call API to update post
        break;
      case 'delete_post':
        // Call API to delete post
        break;
    }
  }

  // Save draft
  async saveDraft(draft) {
    if (!this.db) return;

    const transaction = this.db.transaction(['drafts'], 'readwrite');
    const store = transaction.objectStore('drafts');
    
    return new Promise((resolve, reject) => {
      const request = store.add({
        ...draft,
        saved_at: Date.now()
      });
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get drafts
  async getDrafts() {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['drafts'], 'readonly');
      const store = transaction.objectStore('drafts');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineManager = new OfflineFirstManager();