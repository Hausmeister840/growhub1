import { useEffect, useRef } from 'react';
import { mediaPreloader } from '../services/MediaPreloader';

/**
 * 🎯 HOOK: Automatisches Media-Preloading für Feed
 * Lädt Medien im Voraus basierend auf Scroll-Position
 */

export function useMediaPreloader(posts, currentVisibleIndex = 0, enabled = true) {
  const lastPreloadIndexRef = useRef(-1);

  useEffect(() => {
    if (!enabled || !posts || posts.length === 0) return;

    // Nur preloaden wenn sich der Index geändert hat
    if (currentVisibleIndex === lastPreloadIndexRef.current) {
      return;
    }

    lastPreloadIndexRef.current = currentVisibleIndex;

    // Asynchrones Preloading
    mediaPreloader.preloadFeedMedia(posts, currentVisibleIndex);

  }, [posts, currentVisibleIndex, enabled]);

  // Cleanup bei Unmount
  useEffect(() => {
    return () => {
      // Cache behalten für schnellen Re-Mount
      // mediaPreloader.clearCache();
    };
  }, []);

  return {
    isPreloaded: (postId) => mediaPreloader.isPreloaded(postId),
    preloadPost: (post) => mediaPreloader.preloadPostMedia(post)
  };
}

export default useMediaPreloader;