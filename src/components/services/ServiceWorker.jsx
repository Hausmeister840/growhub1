/**
 * Service Worker Registration & Management
 * Handles offline caching, push notifications, and background sync
 */

class ServiceWorkerManager {
  constructor() {
    this.registration = null;
    this.isSupported = 'serviceWorker' in navigator;
  }

  /**
   * Register service worker
   */
  async register() {
    if (!this.isSupported) {
      console.log('Service Workers not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      this.registration = registration;

      console.log('Service Worker registered:', registration.scope);

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60000); // Check every minute

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            this.notifyUpdate();
          }
        });
      });

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  /**
   * Notify user about update
   */
  notifyUpdate() {
    const event = new CustomEvent('sw-update-available');
    window.dispatchEvent(event);
  }

  /**
   * Activate waiting service worker
   */
  async activateUpdate() {
    if (!this.registration || !this.registration.waiting) {
      return;
    }

    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    // Reload page after activation
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }

  /**
   * Unregister service worker
   */
  async unregister() {
    if (!this.registration) {
      return false;
    }

    return await this.registration.unregister();
  }

  /**
   * Get registration
   */
  getRegistration() {
    return this.registration;
  }
}

export default new ServiceWorkerManager();