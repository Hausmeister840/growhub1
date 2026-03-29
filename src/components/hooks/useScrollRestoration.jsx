import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scroll Restoration Hook
 * Saves and restores scroll position on navigation
 */
export function useScrollRestoration(key = 'default') {
  const location = useLocation();

  useEffect(() => {
    // Save scroll position before leaving
    const handleScroll = () => {
      const scrollY = window.scrollY;
      sessionStorage.setItem(`scroll-${key}-${location.pathname}`, String(scrollY));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname, key]);

  useEffect(() => {
    // Restore scroll position on mount
    const savedPosition = sessionStorage.getItem(`scroll-${key}-${location.pathname}`);
    
    if (savedPosition) {
      // Delay to ensure content is loaded
      requestAnimationFrame(() => {
        window.scrollTo({
          top: parseInt(savedPosition, 10),
          left: 0,
          behavior: 'auto',
        });
      });
    }
  }, [location.pathname, key]);
}