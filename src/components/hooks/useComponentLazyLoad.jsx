import { useState, useEffect } from 'react';

/**
 * Component Lazy Load Hook
 * Dynamically loads components when needed
 */
export function useComponentLazyLoad(importFn, fallback = null) {
  const [Component, setComponent] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    importFn()
      .then(module => {
        if (mounted) {
          setComponent(() => module.default || module);
          setIsLoading(false);
        }
      })
      .catch(err => {
        if (mounted) {
          setError(err);
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [importFn]);

  return { Component, isLoading, error };
}