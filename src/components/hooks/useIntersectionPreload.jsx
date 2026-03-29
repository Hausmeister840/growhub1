import { useEffect, useRef } from 'react';

/**
 * Intersection Preload Hook
 * Preloads content when elements enter viewport
 */
export function useIntersectionPreload(callback, options = {}) {
  const {
    threshold = 0.1,
    rootMargin = '200px',
    once = true
  } = options;

  const elementRef = useRef(null);
  const hasTriggered = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (once && hasTriggered.current) return;
            
            callback();
            hasTriggered.current = true;

            if (once) {
              observer.disconnect();
            }
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [callback, threshold, rootMargin, once]);

  return elementRef;
}