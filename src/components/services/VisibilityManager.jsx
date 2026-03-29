/**
 * Visibility Manager
 * Manages app visibility and background/foreground state
 */

class VisibilityManager {
  constructor() {
    this.isVisible = !document.hidden;
    this.listeners = [];
    this.init();
  }

  /**
   * Initialize
   */
  init() {
    document.addEventListener('visibilitychange', () => {
      this.isVisible = !document.hidden;
      this.notifyListeners();
    });
  }

  /**
   * Add listener
   */
  addListener(callback) {
    this.listeners.push(callback);
    return () => this.removeListener(callback);
  }

  /**
   * Remove listener
   */
  removeListener(callback) {
    this.listeners = this.listeners.filter(cb => cb !== callback);
  }

  /**
   * Notify listeners
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.isVisible);
      } catch (error) {
        console.error('Visibility listener error:', error);
      }
    });
  }

  /**
   * Get visibility state
   */
  getState() {
    return {
      isVisible: this.isVisible,
      isHidden: !this.isVisible
    };
  }
}

export default new VisibilityManager();