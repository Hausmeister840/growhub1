import { useState, useEffect } from 'react';

/**
 * Deferred Value Hook
 * Defers non-urgent updates to improve responsiveness
 */
export function useDeferredValue(value, delay = 100) {
  const [deferredValue, setDeferredValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDeferredValue(value);
    }, delay);

    return () => clearTimeout(timeout);
  }, [value, delay]);

  return deferredValue;
}