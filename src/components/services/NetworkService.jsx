import { toast } from 'sonner';

/**
 * Network Service
 * Handles network errors, retry logic, and offline detection
 */

class NetworkService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.retryAttempts = 3;
    this.retryDelay = 1000;
    this.listeners = new Set();

    // Monitor connection
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  handleOnline() {
    this.isOnline = true;
    toast.success('Verbindung wiederhergestellt');
    this.notifyListeners(true);
  }

  handleOffline() {
    this.isOnline = false;
    toast.error('Keine Internetverbindung');
    this.notifyListeners(false);
  }

  /**
   * Add connection listener
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(isOnline) {
    this.listeners.forEach(callback => callback(isOnline));
  }

  /**
   * Retry function with exponential backoff
   */
  async retry(fn, maxAttempts = this.retryAttempts) {
    let lastError;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Don't retry on certain errors
        if (this.shouldNotRetry(error)) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxAttempts - 1) {
          const delay = this.retryDelay * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Check if error should not be retried
   */
  shouldNotRetry(error) {
    // Don't retry on auth errors
    if (error.message?.includes('401') || error.message?.includes('403')) {
      return true;
    }

    // Don't retry on validation errors
    if (error.message?.includes('400')) {
      return true;
    }

    return false;
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute with network check
   */
  async execute(fn, showOfflineToast = true) {
    if (!this.isOnline) {
      if (showOfflineToast) {
        toast.error('Keine Internetverbindung');
      }
      throw new Error('No internet connection');
    }

    return await this.retry(fn);
  }

  /**
   * Check connection status
   */
  getStatus() {
    return this.isOnline;
  }
}

export default new NetworkService();