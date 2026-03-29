/**
 * Haptic Feedback Service
 * Provides tactile feedback for user interactions
 */

class HapticService {
  constructor() {
    this.isSupported = 'vibrate' in navigator;
    this.isEnabled = true;
  }

  /**
   * Light tap feedback (10ms)
   */
  light() {
    if (this.isSupported && this.isEnabled) {
      navigator.vibrate(10);
    }
  }

  /**
   * Medium feedback (20ms)
   */
  medium() {
    if (this.isSupported && this.isEnabled) {
      navigator.vibrate(20);
    }
  }

  /**
   * Heavy feedback (30ms)
   */
  heavy() {
    if (this.isSupported && this.isEnabled) {
      navigator.vibrate(30);
    }
  }

  /**
   * Success pattern (short-pause-short)
   */
  success() {
    if (this.isSupported && this.isEnabled) {
      navigator.vibrate([10, 50, 10]);
    }
  }

  /**
   * Error pattern (long)
   */
  error() {
    if (this.isSupported && this.isEnabled) {
      navigator.vibrate(50);
    }
  }

  /**
   * Warning pattern (short-short)
   */
  warning() {
    if (this.isSupported && this.isEnabled) {
      navigator.vibrate([15, 30, 15]);
    }
  }

  /**
   * Enable/disable haptics
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    localStorage.setItem('haptics_enabled', enabled);
  }

  /**
   * Get current state
   */
  getEnabled() {
    const stored = localStorage.getItem('haptics_enabled');
    return stored !== null ? stored === 'true' : true;
  }
}

export default new HapticService();