import { useEffect, useRef } from 'react';

/**
 * Memory Cleanup Hook
 * Prevents memory leaks by cleaning up resources
 */
export function useMemoryCleanup() {
  const timeoutsRef = useRef(new Set());
  const intervalsRef = useRef(new Set());
  const listenersRef = useRef(new Map());

  // Safe timeout
  const safeSetTimeout = (callback, delay) => {
    const id = setTimeout(callback, delay);
    timeoutsRef.current.add(id);
    return id;
  };

  // Safe interval
  const safeSetInterval = (callback, delay) => {
    const id = setInterval(callback, delay);
    intervalsRef.current.add(id);
    return id;
  };

  // Safe event listener
  const safeAddEventListener = (target, event, handler, options) => {
    target.addEventListener(event, handler, options);
    
    const key = `${target.constructor.name}-${event}`;
    if (!listenersRef.current.has(key)) {
      listenersRef.current.set(key, []);
    }
    listenersRef.current.get(key).push({ target, event, handler, options });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear timeouts
      timeoutsRef.current.forEach(id => clearTimeout(id));
      timeoutsRef.current.clear();

      // Clear intervals
      intervalsRef.current.forEach(id => clearInterval(id));
      intervalsRef.current.clear();

      // Remove event listeners
      listenersRef.current.forEach(listeners => {
        listeners.forEach(({ target, event, handler, options }) => {
          target.removeEventListener(event, handler, options);
        });
      });
      listenersRef.current.clear();
    };
  }, []);

  return {
    setTimeout: safeSetTimeout,
    setInterval: safeSetInterval,
    addEventListener: safeAddEventListener
  };
}