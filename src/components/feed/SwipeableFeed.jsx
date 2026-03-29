import { useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

/**
 * Wraps feed content and allows horizontal swiping between tabs.
 * tabs: array of {id, label}
 * activeTab: current tab id
 * onTabChange: (tabId) => void
 */
export default function SwipeableFeed({ children, tabs, activeTab, onTabChange }) {
  const x = useMotionValue(0);
  const containerRef = useRef(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const isDragging = useRef(false);
  const isHorizontal = useRef(null);

  const currentIndex = tabs.findIndex(t => t.id === activeTab);

  const handleTouchStart = useCallback((e) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
    isHorizontal.current = null;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging.current) return;
    
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    // Determine direction on first significant move
    if (isHorizontal.current === null) {
      if (Math.abs(dx) > 12 || Math.abs(dy) > 12) {
        isHorizontal.current = Math.abs(dx) > Math.abs(dy) * 1.5; // require clearly horizontal
      }
      return;
    }

    if (isHorizontal.current) {
      // Don't preventDefault here to avoid passive listener warnings
      // CSS touch-action: pan-y handles the scrolling lock
      x.set(dx * 0.4); // damped movement
    }
  }, [x]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current || !isHorizontal.current) {
      isDragging.current = false;
      isHorizontal.current = null;
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
      return;
    }

    const currentX = x.get();
    const threshold = 60;

    if (currentX > threshold && currentIndex > 0) {
      // Swipe right → previous tab
      onTabChange(tabs[currentIndex - 1].id);
    } else if (currentX < -threshold && currentIndex < tabs.length - 1) {
      // Swipe left → next tab
      onTabChange(tabs[currentIndex + 1].id);
    }

    animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
    isDragging.current = false;
    isHorizontal.current = null;
  }, [x, currentIndex, tabs, onTabChange]);

  const opacity = useTransform(x, [-150, 0, 150], [0.5, 1, 0.5]);

  return (
    <motion.div
      ref={containerRef}
      style={{ x, opacity }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="w-full touch-pan-y"
    >
      {children}
    </motion.div>
  );
}