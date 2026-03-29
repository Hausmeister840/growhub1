/**
 * 🖼️ IMAGE OPTIMIZER SERVICE
 * Handles image compression, format conversion, and caching
 */

class ImageOptimizer {
  constructor() {
    this.cache = new Map();
    this.compressionQuality = {
      low: 60,
      medium: 75,
      high: 85,
      max: 95
    };
  }

  /**
   * Optimize image URL with CDN parameters
   */
  optimizeUrl(url, options = {}) {
    if (!url) return '';

    const {
      width = null,
      height = null,
      quality = 'high',
      format = 'auto',
      fit = 'cover'
    } = options;

    // Check cache
    const cacheKey = `${url}_${width}_${height}_${quality}_${format}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // If already has parameters or is from known CDN, return as-is
    if (
      url.includes('?') ||
      url.includes('cloudinary.com') ||
      url.includes('imgix.net') ||
      url.includes('imagekit.io')
    ) {
      return url;
    }

    // Build optimization parameters
    const params = new URLSearchParams();
    
    if (width) params.set('w', width);
    if (height) params.set('h', height);
    if (quality) params.set('q', this.compressionQuality[quality] || quality);
    if (format && format !== 'auto') params.set('f', format);
    if (fit) params.set('fit', fit);

    const optimizedUrl = params.toString() 
      ? `${url}?${params.toString()}`
      : url;

    // Cache result
    this.cache.set(cacheKey, optimizedUrl);

    return optimizedUrl;
  }

  /**
   * Generate responsive srcset
   */
  generateSrcSet(url, baseWidth) {
    if (!url || !baseWidth) return '';

    const breakpoints = [0.5, 0.75, 1, 1.5, 2];
    
    return breakpoints
      .map(multiplier => {
        const width = Math.floor(baseWidth * multiplier);
        const quality = multiplier <= 1 ? 'medium' : 'high';
        const optimized = this.optimizeUrl(url, { width, quality });
        return `${optimized} ${width}w`;
      })
      .join(', ');
  }

  /**
   * Preload critical images
   */
  preload(urls, priority = 'high') {
    if (!Array.isArray(urls)) urls = [urls];

    urls.forEach(url => {
      if (!url) return;

      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = this.optimizeUrl(url, { quality: priority });
      link.fetchPriority = priority;
      
      document.head.appendChild(link);
    });
  }

  /**
   * Convert to WebP if supported
   */
  supportsWebP() {
    if (typeof window === 'undefined') return false;

    const canvas = document.createElement('canvas');
    if (canvas.getContext && canvas.getContext('2d')) {
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }
    return false;
  }

  /**
   * Get optimal format
   */
  getOptimalFormat() {
    if (this.supportsWebP()) return 'webp';
    return 'auto';
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

export const imageOptimizer = new ImageOptimizer();
export default imageOptimizer;