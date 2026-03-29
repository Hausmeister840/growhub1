import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 🚀 VIRTUALIZED FEED
 * Rendert nur sichtbare Posts für maximale Performance
 */
export default function VirtualizedFeed({
  items = [],
  renderItem,
  itemHeight = 600,
  overscan = 3,
  className = ''
}) {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  const containerRef = useRef(null);
  const scrollRef = useRef(null);
  const resizeObserverRef = useRef(null);

  const totalHeight = items.length * itemHeight;
  const startOffset = visibleRange.start * itemHeight;

  const updateVisibleRange = useCallback(() => {
    if (!containerRef.current) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const viewportHeight = window.innerHeight;

    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const end = Math.min(
      items.length,
      Math.ceil((scrollTop + viewportHeight) / itemHeight) + overscan
    );

    setVisibleRange(prev => {
      if (prev.start !== start || prev.end !== end) {
        return { start, end };
      }
      return prev;
    });
  }, [items.length, itemHeight, overscan]);

  useEffect(() => {
    updateVisibleRange();

    const handleScroll = () => {
      if (scrollRef.current) {
        cancelAnimationFrame(scrollRef.current);
      }
      scrollRef.current = requestAnimationFrame(updateVisibleRange);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateVisibleRange, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateVisibleRange);
      if (scrollRef.current) {
        cancelAnimationFrame(scrollRef.current);
      }
    };
  }, [updateVisibleRange]);

  // Observer für dynamische Höhen
  useEffect(() => {
    if (!containerRef.current) return;

    resizeObserverRef.current = new ResizeObserver(() => {
      updateVisibleRange();
    });

    const children = containerRef.current.children;
    Array.from(children).forEach(child => {
      resizeObserverRef.current.observe(child);
    });

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [visibleRange, updateVisibleRange]);

  const visibleItems = items.slice(visibleRange.start, visibleRange.end);

  return (
    <div className={className} style={{ position: 'relative', minHeight: totalHeight }}>
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          transform: `translateY(${startOffset}px)`
        }}
      >
        <AnimatePresence mode="popLayout">
          {visibleItems.map((item, idx) => {
            const actualIndex = visibleRange.start + idx;
            return (
              <motion.div
                key={item.id || actualIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.02 }}
                style={{ marginBottom: '12px' }}
              >
                {renderItem(item, actualIndex)}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}