import { useEffect, useRef } from 'react';

/**
 * Hook to prevent memory leaks by cleaning up resources
 */
export function useMemoryOptimization(cleanupFn) {
  const cleanupRef = useRef(cleanupFn);

  useEffect(() => {
    cleanupRef.current = cleanupFn;
  }, [cleanupFn]);

  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);
}

/**
 * Hook to limit the number of re-renders
 */
export function useThrottle(value, delay = 500) {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= delay) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, delay - (Date.now() - lastRan.current));

    return () => clearTimeout(handler);
  }, [value, delay]);

  return throttledValue;
}

/**
 * Hook to detect memory pressure
 */
export function useMemoryPressure() {
  const [isLowMemory, setIsLowMemory] = useState(false);

  useEffect(() => {
    if (!('memory' in performance)) return;

    const checkMemory = () => {
      const memory = performance.memory;
      const usedRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      
      if (usedRatio > 0.9) {
        setIsLowMemory(true);
      } else if (usedRatio < 0.7) {
        setIsLowMemory(false);
      }
    };

    const interval = setInterval(checkMemory, 5000);
    checkMemory();

    return () => clearInterval(interval);
  }, []);

  return isLowMemory;
}

export default useMemoryOptimization;