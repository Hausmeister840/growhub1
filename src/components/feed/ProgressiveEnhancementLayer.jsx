// Progressive Enhancement - Adds features based on device capabilities
class ProgressiveEnhancementLayer {
  constructor() {
    this.capabilities = this.detectCapabilities();
  }

  detectCapabilities() {
    return {
      // Network
      effectiveType: this.getNetworkType(),
      downlink: this.getDownlink(),
      
      // Hardware
      deviceMemory: (typeof navigator !== 'undefined' && navigator.deviceMemory) || 4,
      hardwareConcurrency: (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 2,
      
      // Features
      webgl: this.checkWebGL(),
      webrtc: this.checkWebRTC(),
      serviceWorker: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
      notifications: typeof window !== 'undefined' && 'Notification' in window,
      vibration: typeof navigator !== 'undefined' && 'vibrate' in navigator,
      geolocation: typeof navigator !== 'undefined' && 'geolocation' in navigator,
      
      // Media
      webp: this.checkWebP(),
      avif: this.checkAVIF(),
      
      // Storage
      indexedDB: typeof window !== 'undefined' && 'indexedDB' in window,
      localStorage: this.checkLocalStorage(),
      
      // Performance
      isHighEnd: this.isHighEndDevice()
    };
  }

  getNetworkType() {
    if (typeof navigator === 'undefined') return '4g';
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return connection?.effectiveType || '4g';
  }

  getDownlink() {
    if (typeof navigator === 'undefined') return 10;
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return connection?.downlink || 10;
  }

  checkWebGL() {
    try {
      if (typeof document === 'undefined') return false;
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch {
      return false;
    }
  }

  checkWebRTC() {
    if (typeof navigator === 'undefined') return false;
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  checkWebP() {
    if (typeof document === 'undefined') return false;
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  checkAVIF() {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(true);
      image.onerror = () => resolve(false);
      image.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
    });
  }

  checkLocalStorage() {
    try {
      if (typeof localStorage === 'undefined') return false;
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch {
      return false;
    }
  }

  isHighEndDevice() {
    if (!this.capabilities) return false;
    return (
      (this.capabilities.deviceMemory || 4) >= 8 &&
      (this.capabilities.hardwareConcurrency || 2) >= 4 &&
      (this.capabilities.downlink || 10) >= 5
    );
  }

  // Get recommended quality level
  getQualityLevel() {
    if (this.capabilities.isHighEnd && this.capabilities.downlink >= 10) {
      return 'ultra'; // 4K, high frame rate
    }
    if (this.capabilities.deviceMemory >= 4 && this.capabilities.downlink >= 5) {
      return 'high'; // 1080p
    }
    if (this.capabilities.downlink >= 2) {
      return 'medium'; // 720p
    }
    return 'low'; // 480p
  }

  // Should load feature
  shouldLoad(feature) {
    const requirements = {
      '3d_effects': this.capabilities.webgl && this.capabilities.isHighEnd,
      'video_autoplay': this.capabilities.downlink >= 5,
      'hd_images': this.capabilities.downlink >= 3,
      'animations': this.capabilities.deviceMemory >= 2,
      'ar_features': this.capabilities.webgl && this.capabilities.geolocation,
      'voice_commands': this.capabilities.webrtc,
      'offline_mode': this.capabilities.serviceWorker && this.capabilities.indexedDB
    };

    return requirements[feature] !== false;
  }

  // Get image format to use
  getOptimalImageFormat() {
    if (this.capabilities.avif) return 'avif';
    if (this.capabilities.webp) return 'webp';
    return 'jpeg';
  }

  // Get feature recommendations
  getRecommendations() {
    const recommendations = [];

    if (!this.capabilities.serviceWorker) {
      recommendations.push('Offline-Modus nicht verfügbar - Browser-Update empfohlen');
    }
    if (this.capabilities.downlink < 2) {
      recommendations.push('Langsame Verbindung - Datensparmodus aktivieren');
    }
    if (this.capabilities.deviceMemory < 4) {
      recommendations.push('Wenig RAM - Animationen reduziert');
    }

    return recommendations;
  }
}

export const enhancementLayer = new ProgressiveEnhancementLayer();