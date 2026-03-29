import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ImageOptimizationService from '../services/ImageOptimizationService';

export default function OptimizedImage({ 
  src, 
  alt, 
  width, 
  height, 
  className = '',
  priority = false,
  onLoad,
  fallback = null
}) {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    // Priority images load immediately
    if (priority) {
      loadImage();
      return;
    }

    // Lazy load with IntersectionObserver
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage();
            if (observerRef.current) {
              observerRef.current.disconnect();
            }
          }
        });
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [src, priority]);

  const loadImage = () => {
    if (!src) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    const optimizedUrl = ImageOptimizationService.getOptimizedUrl(src, width, height);
    
    const img = new Image();
    img.onload = () => {
      setImageSrc(optimizedUrl);
      setIsLoading(false);
      if (onLoad) onLoad();
    };
    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
    };
    img.src = optimizedUrl;
  };

  if (hasError && fallback) {
    return fallback;
  }

  if (hasError) {
    return (
      <div 
        ref={imgRef}
        className={`bg-zinc-900 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-zinc-600 text-sm">🖼️</span>
      </div>
    );
  }

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div 
          className="absolute inset-0 bg-zinc-900 animate-pulse"
          style={{ width, height }}
        />
      )}
      
      {imageSrc && (
        <motion.img
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          className={`object-cover ${className}`}
          loading={priority ? 'eager' : 'lazy'}
        />
      )}
    </div>
  );
}