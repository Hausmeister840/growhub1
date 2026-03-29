import { useState, useRef, useCallback } from 'react';

/**
 * Virtual Scrolling Hook
 * Renders only visible items for performance
 */
export function useVirtualScroll(items, options = {}) {
  const {
    itemHeight = 100,
    overscan = 3,
    containerHeight = 600
  } = options;

  const [scrollTop, setScrollTop] = useState(0);
  const scrollRef = useRef(null);

  const totalHeight = items.length * itemHeight;
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(items.length, startIndex + visibleCount + 2 * overscan);
  
  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return {
    scrollRef,
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    startIndex,
    endIndex
  };
}