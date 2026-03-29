/**
 * Progressive Enhancement Service
 * Detects capabilities and enables features progressively
 */

class ProgressiveEnhancement {
  constructor() {
    this.capabilities = {
      webp: false,
      avif: false,
      intersectionObserver: false,
      serviceWorker: false,
      webWorker: false,
      indexedDB: false,
      battery: false,
      vibration: false,
      shareAPI: false
    };
  }

  /**
   * Detect all capabilities
   */
  async detectCapabilities() {
    await Promise.all([
      this.detectImageFormats(),
      this.detectAPIs()
    ]);

    return this.capabilities;
  }

  /**
   * Detect image format support
   */
  async detectImageFormats() {
    this.capabilities.webp = await this.canUseImageFormat('webp');
    this.capabilities.avif = await this.canUseImageFormat('avif');
  }

  /**
   * Check image format support
   */
  canUseImageFormat(format) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(img.width === 1);
      img.onerror = () => resolve(false);
      
      const formats = {
        webp: 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=',
        avif: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI='
      };
      
      img.src = formats[format];
    });
  }

  /**
   * Detect API support
   */
  detectAPIs() {
    this.capabilities.intersectionObserver = 'IntersectionObserver' in window;
    this.capabilities.serviceWorker = 'serviceWorker' in navigator;
    this.capabilities.webWorker = 'Worker' in window;
    this.capabilities.indexedDB = 'indexedDB' in window;
    this.capabilities.battery = 'getBattery' in navigator;
    this.capabilities.vibration = 'vibrate' in navigator;
    this.capabilities.shareAPI = 'share' in navigator;
  }

  /**
   * Get optimal image format
   */
  getOptimalImageFormat() {
    if (this.capabilities.avif) return 'avif';
    if (this.capabilities.webp) return 'webp';
    return 'jpg';
  }

  /**
   * Can use feature
   */
  canUse(feature) {
    return this.capabilities[feature] || false;
  }

  /**
   * Get all capabilities
   */
  getCapabilities() {
    return { ...this.capabilities };
  }
}

export default new ProgressiveEnhancement();