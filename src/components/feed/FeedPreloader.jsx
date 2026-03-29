import { useEffect, useRef } from 'react';
import { isVideoUrl } from '@/components/utils/media';

/**
 * Aggressively preloads media for smoother feed scrolling.
 * Preloads images via Image() and videos via <link rel="prefetch">.
 * Also preloads ALL media from all visible posts on mount for instant feel.
 */
export default function FeedPreloader({ posts, currentIndex = 0, ahead = 12 }) {
  const preloadedRef = useRef(new Set());

  useEffect(() => {
    if (!posts?.length) return;

    const end = Math.min(posts.length, currentIndex + ahead);

    for (let i = currentIndex; i < end; i++) {
      const post = posts[i]?.post || posts[i];
      const urls = post?.media_urls;
      if (!urls?.length) continue;

      // Preload ALL media urls per post (not just first)
      for (const url of urls) {
        if (!url || preloadedRef.current.has(url)) continue;
        preloadedRef.current.add(url);

        if (isVideoUrl(url)) {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.as = 'fetch';
          link.href = url;
          link.crossOrigin = 'anonymous';
          document.head.appendChild(link);
        } else {
          const img = new Image();
          img.decoding = 'async';
          img.src = url;
        }
      }
    }

    // Also preload avatar images for visible posts
    for (let i = currentIndex; i < end; i++) {
      const postUser = posts[i]?.postUser;
      const avatarUrl = postUser?.avatar_url;
      if (avatarUrl && !preloadedRef.current.has(avatarUrl)) {
        preloadedRef.current.add(avatarUrl);
        const img = new Image();
        img.decoding = 'async';
        img.src = avatarUrl;
      }
    }

    // Keep set from growing too large
    if (preloadedRef.current.size > 200) {
      const arr = [...preloadedRef.current];
      preloadedRef.current = new Set(arr.slice(-100));
    }
  }, [posts, currentIndex, ahead]);

  return null;
}