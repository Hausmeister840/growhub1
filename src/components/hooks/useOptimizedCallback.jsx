import { useCallback, useRef } from 'react';

/**
 * Optimized Callback Hook
 * Creates stable callback references
 */
export function useOptimizedCallback(callback, deps = []) {
  const callbackRef = useRef(callback);

  // Update ref when callback changes
  callbackRef.current = callback;

  // Return stable callback that calls latest version
  return useCallback((...args) => {
    return callbackRef.current(...args);
  }, deps);
}