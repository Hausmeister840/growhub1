import { useState, useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { ImageIcon } from 'lucide-react';

const SmartImage = memo(({ 
  src, 
  alt = '', 
  className = '',
  aspectRatio = '16/9',
  priority = false,
  onLoad,
  fallback
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    if (!src || priority) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && imgRef.current) {
            imgRef.current.src = src;
            observerRef.current?.disconnect();
          }
        });
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [src, priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setError(true);
  };

  if (error) {
    return (
      <div 
        className={`bg-zinc-900 flex items-center justify-center ${className}`}
        style={{ aspectRatio }}
      >
        {fallback || (
          <div className="flex flex-col items-center gap-2 text-zinc-600">
            <ImageIcon className="w-8 h-8" />
            <span className="text-xs">Bild nicht verfügbar</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-zinc-900 ${className}`} style={{ aspectRatio }}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 animate-pulse" />
      )}
      
      <motion.img
        ref={imgRef}
        src={priority ? src : undefined}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className={`w-full h-full object-cover ${className}`}
      />
    </div>
  );
});

SmartImage.displayName = 'SmartImage';

export default SmartImage;