/**
 * Central Optimization Service
 * Coordinates all performance optimizations
 */

class OptimizationService {
  constructor() {
    this.settings = {
      reduceMotion: false,
      reduceQuality: false,
      offlineMode: false,
      batteryOptimization: false
    };
    
    this.listeners = new Set();
  }

  /**
   * Initialize optimizations
   */
  init() {
    this.detectPreferences();
    this.detectNetworkQuality();
    this.detectBattery();
    this.detectOfflineMode();
  }

  /**
   * Detect user preferences
   */
  detectPreferences() {
    // Reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.settings.reduceMotion = prefersReducedMotion.matches;

    prefersReducedMotion.addEventListener('change', (e) => {
      this.settings.reduceMotion = e.matches;
      this.notifyListeners();
    });
  }

  /**
   * Detect network quality
   */
  detectNetworkQuality() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (!connection) return;

    const updateQuality = () => {
      this.settings.reduceQuality = 
        connection.saveData || 
        connection.effectiveType === 'slow-2g' || 
        connection.effectiveType === '2g';
      
      this.notifyListeners();
    };

    updateQuality();
    connection.addEventListener('change', updateQuality);
  }

  /**
   * Detect battery level
   */
  async detectBattery() {
    if (!('getBattery' in navigator)) return;

    try {
      const battery = await navigator.getBattery();

      const updateBattery = () => {
        this.settings.batteryOptimization = battery.level < 0.2 && !battery.charging;
        this.notifyListeners();
      };

      updateBattery();
      battery.addEventListener('levelchange', updateBattery);
      battery.addEventListener('chargingchange', updateBattery);
    } catch (error) {
      console.warn('Battery API not available');
    }
  }

  /**
   * Detect offline mode
   */
  detectOfflineMode() {
    const updateOnlineStatus = () => {
      this.settings.offlineMode = !navigator.onLine;
      this.notifyListeners();
    };

    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
  }

  /**
   * Get optimization settings
   */
  getSettings() {
    return { ...this.settings };
  }

  /**
   * Subscribe to changes
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify listeners
   */
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.settings));
  }

  /**
   * Should reduce animations
   */
  shouldReduceAnimations() {
    return this.settings.reduceMotion || this.settings.batteryOptimization;
  }

  /**
   * Should reduce quality
   */
  shouldReduceQuality() {
    return this.settings.reduceQuality || this.settings.batteryOptimization;
  }

  /**
   * Is offline
   */
  isOffline() {
    return this.settings.offlineMode;
  }
}

export default new OptimizationService();