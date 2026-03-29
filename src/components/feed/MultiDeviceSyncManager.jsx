// Sync feed state across multiple devices
class MultiDeviceSyncManager {
  constructor() {
    this.deviceId = this.generateDeviceId();
    this.syncChannel = null;
    this.state = {
      scrollPosition: 0,
      activeTab: 'foryou',
      readPosts: new Set(),
      lastSync: null
    };
  }

  generateDeviceId() {
    if (typeof localStorage === 'undefined') return 'device_ssr';
    
    try {
      const stored = localStorage.getItem('device_id');
      if (stored) return stored;
      
      const id = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('device_id', id);
      return id;
    } catch {
      return `device_${Date.now()}`;
    }
  }

  // Initialize sync channel
  async initialize(userId) {
    if (!userId || typeof window === 'undefined') return;

    // Use BroadcastChannel for same-browser sync
    if (typeof BroadcastChannel !== 'undefined') {
      this.syncChannel = new BroadcastChannel(`growhub_sync_${userId}`);
      
      this.syncChannel.onmessage = (event) => {
        if (event.data.deviceId === this.deviceId) return;
        
        this.handleRemoteUpdate(event.data);
      };
    }

    // Load persisted state
    this.loadState(userId);
  }

  // Sync state to other devices
  broadcast(update) {
    if (!this.syncChannel) return;

    this.syncChannel.postMessage({
      deviceId: this.deviceId,
      timestamp: Date.now(),
      ...update
    });

    this.saveState();
  }

  // Handle updates from other devices
  handleRemoteUpdate(data) {
    console.log('Sync from other device:', data);

    if (data.scrollPosition !== undefined) {
      this.state.scrollPosition = data.scrollPosition;
    }
    if (data.activeTab) {
      this.state.activeTab = data.activeTab;
    }
    if (data.readPosts) {
      data.readPosts.forEach(postId => this.state.readPosts.add(postId));
    }

    this.state.lastSync = Date.now();

    // Emit event for UI update
    window.dispatchEvent(new CustomEvent('remoteSync', { detail: this.state }));
  }

  // Mark post as read
  markAsRead(postId) {
    this.state.readPosts.add(postId);
    this.broadcast({ readPosts: [postId] });
  }

  // Update scroll position
  updateScrollPosition(position) {
    this.state.scrollPosition = position;
    this.broadcast({ scrollPosition: position });
  }

  // Update active tab
  updateActiveTab(tab) {
    this.state.activeTab = tab;
    this.broadcast({ activeTab: tab });
  }

  // Save to localStorage
  saveState() {
    if (typeof localStorage === 'undefined') return;
    
    try {
      localStorage.setItem('feed_state', JSON.stringify({
        ...this.state,
        readPosts: Array.from(this.state.readPosts)
      }));
    } catch (error) {
      console.warn('Failed to save state:', error);
    }
  }

  // Load from localStorage
  loadState(userId) {
    if (typeof localStorage === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('feed_state');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.state = {
          ...parsed,
          readPosts: new Set(parsed.readPosts || [])
        };
      }
    } catch (error) {
      console.warn('Failed to load state:', error);
    }
  }

  // Cleanup
  destroy() {
    if (this.syncChannel) {
      this.syncChannel.close();
    }
    this.saveState();
  }
}

export const syncManager = new MultiDeviceSyncManager();