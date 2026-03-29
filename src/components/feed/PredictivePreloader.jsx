import { useEffect, useRef } from 'react';

export default function PredictivePreloader({ posts, enabled = true }) {
  const preloadedUrls = useRef(new Set());
  const scrollDirection = useRef('down');
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (!enabled || !posts || posts.length === 0) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      scrollDirection.current = currentScrollY > lastScrollY.current ? 'down' : 'up';
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !posts || posts.length === 0) return;

    // Preload next 5 posts' media
    const preloadNext = async () => {
      const visibleIndex = Math.floor(window.scrollY / 600);
      const startIndex = scrollDirection.current === 'down' 
        ? visibleIndex + 1 
        : Math.max(0, visibleIndex - 5);
      const endIndex = startIndex + 5;

      for (let i = startIndex; i < endIndex && i < posts.length; i++) {
        const post = posts[i];
        if (!post?.media_urls) continue;

        post.media_urls.forEach(url => {
          if (!preloadedUrls.current.has(url)) {
            const img = new Image();
            img.src = url;
            preloadedUrls.current.add(url);
          }
        });
      }
    };

    const debounceTimer = setTimeout(preloadNext, 200);
    return () => clearTimeout(debounceTimer);
  }, [posts, enabled]);

  return null;
}