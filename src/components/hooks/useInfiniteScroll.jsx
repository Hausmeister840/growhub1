import { useEffect, useRef, useCallback } from 'react';

/**
 * Infinite Scroll Hook
 * Triggers callback when user scrolls near bottom
 */
export function useInfiniteScroll(callback, options = {}) {
  const {
    threshold = 500,
    enabled = true
  } = options;

  const observerRef = useRef(null);
  const targetRef = useRef(null);

  const handleObserver = useCallback((entries) => {
    const target = entries[0];
    if (target.isIntersecting && enabled) {
      callback();
    }
  }, [callback, enabled]);

  useEffect(() => {
    if (!targetRef.current || !enabled) return;

    const options = {
      root: null,
      rootMargin: `${threshold}px`,
      threshold: 0.1
    };

    observerRef.current = new IntersectionObserver(handleObserver, options);
    observerRef.current.observe(targetRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver, threshold, enabled]);

  return targetRef;
}