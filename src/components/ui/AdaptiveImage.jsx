import { useState, useEffect } from 'react';
import { useNetworkQuality } from '../hooks/useNetworkQuality';
import { useBatteryOptimization } from '../hooks/useBatteryOptimization';

/**
 * Adaptive Image Component
 * Adjusts image quality based on network and battery
 */
export default function AdaptiveImage({ 
  src, 
  alt = '', 
  className = '',
  priority = false,
  ...props 
}) {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const { quality, saveData } = useNetworkQuality();
  const { shouldOptimize } = useBatteryOptimization();

  useEffect(() => {
    if (!src) return;

    // Determine image quality
    let finalSrc = src;

    // If it's a Supabase storage URL, add quality params
    if (src.includes('supabase.co/storage')) {
      const url = new URL(src);
      
      if (saveData || shouldOptimize) {
        url.searchParams.set('quality', '50');
        url.searchParams.set('width', '800');
      } else if (quality === 'low') {
        url.searchParams.set('quality', '60');
        url.searchParams.set('width', '1200');
      } else if (quality === 'medium') {
        url.searchParams.set('quality', '75');
        url.searchParams.set('width', '1600');
      }
      
      finalSrc = url.toString();
    }

    setImageSrc(finalSrc);
  }, [src, quality, saveData, shouldOptimize]);

  if (!imageSrc) {
    return (
      <div className={`bg-zinc-900 animate-pulse ${className}`} {...props} />
    );
  }

  return (
    <>
      {!isLoaded && (
        <div className={`bg-zinc-900 animate-pulse absolute inset-0 ${className}`} />
      )}
      <img
        src={imageSrc}
        alt={alt}
        className={`${className} ${!isLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => setIsLoaded(true)}
        loading={priority ? 'eager' : 'lazy'}
        {...props}
      />
    </>
  );
}