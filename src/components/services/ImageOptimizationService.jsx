/**
 * Image Optimization Service
 * Handles image compression, format conversion, and lazy loading
 */

class ImageOptimizationService {
  constructor() {
    this.cache = new Map();
    this.compressionQuality = 0.8;
    this.maxWidth = 1920;
    this.maxHeight = 1080;
  }

  /**
   * Compress and optimize image
   */
  async compressImage(file, options = {}) {
    const {
      quality = this.compressionQuality,
      maxWidth = this.maxWidth,
      maxHeight = this.maxHeight,
      format = 'image/jpeg'
    } = options;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          // Calculate new dimensions
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(new File([blob], file.name, { type: format }));
              } else {
                reject(new Error('Compression failed'));
              }
            },
            format,
            quality
          );
        };

        img.onerror = () => reject(new Error('Image load failed'));
        img.src = e.target.result;
      };

      reader.onerror = () => reject(new Error('File read failed'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Generate thumbnail
   */
  async generateThumbnail(file, size = 300) {
    return this.compressImage(file, {
      maxWidth: size,
      maxHeight: size,
      quality: 0.7
    });
  }

  /**
   * Get optimized image URL with size params
   */
  getOptimizedUrl(url, width, height) {
    if (!url) return null;

    // If already optimized, return as is
    if (url.includes('w=') || url.includes('h=')) {
      return url;
    }

    // Add size params
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}w=${width}&h=${height}&fit=cover&q=80`;
  }

  /**
   * Preload image
   */
  async preloadImage(url) {
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.cache.set(url, img);
        resolve(img);
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  /**
   * Check if WebP is supported
   */
  supportsWebP() {
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  /**
   * Get best format for browser
   */
  getBestFormat() {
    if (this.supportsWebP()) {
      return 'image/webp';
    }
    return 'image/jpeg';
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

export default new ImageOptimizationService();