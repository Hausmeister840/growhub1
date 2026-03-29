import { useRef, useEffect } from 'react';

/**
 * 🎯 PRELOAD TRIGGER HOOK
 * Verhindert mehrfaches Triggern des Preloadings für denselben Index
 */
export function usePreloadTrigger(posts, users, shouldPreload, preloadFn) {
  const lastTriggeredRef = useRef(new Set());
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Reset bei Posts-Change
    lastTriggeredRef.current.clear();
  }, [posts]);

  const triggerPreload = (index) => {
    // Bereits getriggert?
    if (lastTriggeredRef.current.has(index)) return;
    
    // Prüfe ob preloading erlaubt ist
    if (!shouldPreload()) return;

    // Debounce
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      lastTriggeredRef.current.add(index);
      preloadFn(posts, index, users);
    }, 100);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return triggerPreload;
}