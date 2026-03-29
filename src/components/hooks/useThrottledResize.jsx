import { useEffect, useRef } from 'react';

/**
 * Throttled Resize Hook
 * Optimizes resize event handling
 */
export function useThrottledResize(callback, delay = 200, deps = []) {
  const lastRun = useRef(Date.now());
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handleResize = () => {
      const now = Date.now();
      
      if (now - lastRun.current >= delay) {
        callbackRef.current();
        lastRun.current = now;
      }
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [delay, ...deps]);
}