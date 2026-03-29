import { useEffect, useRef } from 'react';

export default function PostVisibilityTracker({ post, onView, children }) {
  const ref = useRef(null);
  const hasViewed = useRef(false);

  useEffect(() => {
    if (!ref.current || hasViewed.current) return;

    let timer = null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Track view when post is 50% visible for at least 1 second
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          timer = setTimeout(() => {
            if (!hasViewed.current && onView) {
              hasViewed.current = true;
              onView(post);
            }
          }, 1000);
        } else {
          if (timer) {
            clearTimeout(timer);
            timer = null;
          }
        }
      },
      {
        threshold: [0.5],
        rootMargin: '0px'
      }
    );

    observer.observe(ref.current);

    return () => {
      if (timer) clearTimeout(timer);
      observer.disconnect();
    };
  }, [post, onView]);

  return (
    <div ref={ref}>
      {children}
    </div>
  );
}