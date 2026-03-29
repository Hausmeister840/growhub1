/**
 * 📱 SERVICE WORKER MANAGER
 * Handles PWA installation, updates, and offline functionality
 */

export class ServiceWorkerManager {
  constructor() {
    this.registration = null;
    this.updateAvailable = false;
    this.listeners = new Set();
  }

  async register() {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers not supported');
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('✅ Service Worker registered');

      // Check for updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('🔄 Update available');
            this.updateAvailable = true;
            this.notifyListeners('update-available');
          }
        });
      });

      // Handle controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Controller changed, reloading...');
        window.location.reload();
      });

      return true;

    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  async checkForUpdates() {
    if (!this.registration) return;

    try {
      await this.registration.update();
      console.log('✅ Checked for updates');
    } catch (error) {
      console.error('Update check failed:', error);
    }
  }

  async skipWaiting() {
    if (!this.registration || !this.registration.waiting) return;

    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  addEventListener(event, callback) {
    this.listeners.add({ event, callback });
  }

  removeEventListener(callback) {
    this.listeners = new Set([...this.listeners].filter(l => l.callback !== callback));
  }

  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      if (listener.event === event) {
        listener.callback(data);
      }
    });
  }
}

export const swManager = new ServiceWorkerManager();

// Auto-register on load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    swManager.register();
  });
}