/**
 * Background Sync Service
 * Handles offline actions and syncs when online
 */

class BackgroundSync {
  constructor() {
    this.queue = [];
    this.syncInProgress = false;
    this.listeners = [];
    
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      this.registerSync();
    }
  }

  /**
   * Add action to queue
   */
  addToQueue(action) {
    const queueItem = {
      id: `${Date.now()}-${Math.random()}`,
      action,
      timestamp: Date.now(),
      retries: 0
    };

    this.queue.push(queueItem);
    this.saveQueue();
    this.notifyListeners();

    return queueItem.id;
  }

  /**
   * Process queue
   */
  async processQueue() {
    if (this.syncInProgress || this.queue.length === 0) return;
    if (!navigator.onLine) return;

    this.syncInProgress = true;

    while (this.queue.length > 0) {
      const item = this.queue[0];

      try {
        await this.executeAction(item.action);
        this.queue.shift();
        this.saveQueue();
        this.notifyListeners();
      } catch (error) {
        item.retries++;
        
        if (item.retries >= 3) {
          this.queue.shift();
          console.error('Max retries reached:', error);
        } else {
          // Move to end of queue
          this.queue.push(this.queue.shift());
        }
        
        this.saveQueue();
        break;
      }
    }

    this.syncInProgress = false;
  }

  /**
   * Execute action
   */
  async executeAction(action) {
    const { type, data } = action;

    switch (type) {
      case 'POST_CREATE':
        return this.syncPost(data);
      case 'COMMENT_CREATE':
        return this.syncComment(data);
      case 'REACTION_ADD':
        return this.syncReaction(data);
      default:
        throw new Error(`Unknown action type: ${type}`);
    }
  }

  /**
   * Sync post
   */
  async syncPost(data) {
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error('Failed to sync post');
    return response.json();
  }

  /**
   * Sync comment
   */
  async syncComment(data) {
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error('Failed to sync comment');
    return response.json();
  }

  /**
   * Sync reaction
   */
  async syncReaction(data) {
    const response = await fetch('/api/reactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error('Failed to sync reaction');
    return response.json();
  }

  /**
   * Save queue to storage
   */
  saveQueue() {
    try {
      localStorage.setItem('sync-queue', JSON.stringify(this.queue));
    } catch (e) {
      console.error('Failed to save queue:', e);
    }
  }

  /**
   * Load queue from storage
   */
  loadQueue() {
    try {
      const saved = localStorage.getItem('sync-queue');
      if (saved) {
        this.queue = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load queue:', e);
    }
  }

  /**
   * Register service worker sync
   */
  async registerSync() {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-queue');
    } catch (e) {
      console.error('Sync registration failed:', e);
    }
  }

  /**
   * Add listener
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Notify listeners
   */
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.queue));
  }

  /**
   * Get queue size
   */
  getQueueSize() {
    return this.queue.length;
  }
}

export default new BackgroundSync();