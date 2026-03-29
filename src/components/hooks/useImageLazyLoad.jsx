import { useState, useEffect, useRef } from 'react';

/**
 * Image Lazy Loading Hook
 * Loads images only when visible
 */
export function useImageLazyLoad(src, options = {}) {
  const { threshold = 0.1, rootMargin = '50px' } = options;
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!src || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.disconnect();
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [src, threshold, rootMargin]);

  const handleLoad = () => setIsLoaded(true);
  const handleError = () => setError(true);

  return {
    imgRef,
    imageSrc,
    isLoaded,
    error,
    handleLoad,
    handleError
  };
}