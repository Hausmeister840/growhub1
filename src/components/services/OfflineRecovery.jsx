/**
 * 🔄 OFFLINE RECOVERY SERVICE
 * Handles automatic recovery when network connection is restored
 */

class OfflineRecoveryService {
  constructor() {
    this.listeners = new Map();
    this.isOnline = navigator.onLine;
    this.wasOffline = false;
    this.recoveryCallbacks = [];
    
    this.init();
  }

  init() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    console.log('🔄 [OfflineRecovery] Service initialized');
  }

  handleOnline = () => {
    console.log('✅ [OfflineRecovery] Connection restored');
    this.isOnline = true;

    if (this.wasOffline) {
      console.log('🔄 [OfflineRecovery] Starting recovery...');
      this.triggerRecovery();
      this.wasOffline = false;
    }

    this.emit('online');
  };

  handleOffline = () => {
    console.log('📡 [OfflineRecovery] Connection lost');
    this.isOnline = false;
    this.wasOffline = true;
    this.emit('offline');
  };

  triggerRecovery() {
    // Execute all recovery callbacks
    this.recoveryCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('❌ [OfflineRecovery] Recovery callback failed:', error);
      }
    });
  }

  /**
   * Register a callback to run when connection is restored
   */
  onRecover(callback) {
    if (typeof callback !== 'function') return;
    
    this.recoveryCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.recoveryCallbacks.indexOf(callback);
      if (index > -1) {
        this.recoveryCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to online/offline events
   */
  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;

    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`❌ [OfflineRecovery] Listener error (${event}):`, error);
      }
    });
  }

  /**
   * Check current online status
   */
  isConnected() {
    return this.isOnline;
  }

  /**
   * Cleanup
   */
  destroy() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.listeners.clear();
    this.recoveryCallbacks = [];
    console.log('🗑️ [OfflineRecovery] Service destroyed');
  }
}

// Singleton instance
const offlineRecovery = new OfflineRecoveryService();

export default offlineRecovery;