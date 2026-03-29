import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

export default function ImageWithFallback({ 
  src, 
  alt = '', 
  className = '',
  priority = false,
  onError,
  onLoad
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  if (hasError) {
    return (
      <div className={`bg-zinc-900 flex items-center justify-center ${className}`}>
        <ImageIcon className="w-12 h-12 text-zinc-700" />
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className={`absolute inset-0 bg-zinc-900 animate-pulse ${className}`} />
      )}
      <img
        src={src}
        alt={alt}
        className={className}
        onError={handleError}
        onLoad={handleLoad}
        loading={priority ? 'eager' : 'lazy'}
      />
    </>
  );
}