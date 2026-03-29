/**
 * Image Compression Service
 * Compresses images before upload
 */

class ImageCompression {
  /**
   * Compress image
   */
  async compress(file, options = {}) {
    const {
      maxWidth = 1920,
      maxHeight = 1920,
      quality = 0.8,
      outputFormat = 'image/jpeg'
    } = options;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          try {
            const compressed = this.processImage(img, {
              maxWidth,
              maxHeight,
              quality,
              outputFormat
            });
            resolve(compressed);
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = reject;
        img.src = e.target.result;
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Process image
   */
  processImage(img, options) {
    const { maxWidth, maxHeight, quality, outputFormat } = options;

    // Calculate dimensions
    let width = img.width;
    let height = img.height;

    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.floor(width * ratio);
      height = Math.floor(height * ratio);
    }

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    // Convert to blob
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        outputFormat,
        quality
      );
    });
  }

  /**
   * Compress multiple images
   */
  async compressMultiple(files, options = {}) {
    return Promise.all(
      Array.from(files).map(file => this.compress(file, options))
    );
  }

  /**
   * Get optimal format
   */
  getOptimalFormat(file) {
    if (file.type === 'image/png' && file.size > 500000) {
      return 'image/jpeg';
    }
    return file.type;
  }

  /**
   * Calculate compression ratio
   */
  calculateRatio(originalSize, compressedSize) {
    return ((1 - compressedSize / originalSize) * 100).toFixed(1);
  }
}

export default new ImageCompression();