import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

export default function LazyImage({ 
  src, 
  alt, 
  className = '', 
  priority = false,
  aspectRatio = '1/1',
  fallback = null 
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isInView, setIsInView] = useState(priority);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoading(false);
    setError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError(true);
  };

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden bg-zinc-900 ${className}`}
      style={{ aspectRatio }}
    >
      {isInView && !error && (
        <>
          <img
            src={src}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
            loading={priority ? 'eager' : 'lazy'}
          />
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
              <Loader2 className="w-6 h-6 text-zinc-600 animate-spin" />
            </div>
          )}
        </>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
          {fallback || (
            <div className="text-zinc-600 text-sm">Bild nicht verfügbar</div>
          )}
        </div>
      )}

      {!isInView && !priority && (
        <div className="absolute inset-0 bg-zinc-900 animate-pulse" />
      )}
    </div>
  );
}