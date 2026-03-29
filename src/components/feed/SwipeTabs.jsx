import React, { useRef, useState, useCallback, useEffect } from 'react';

/**
 * Horizontal swipeable tab container (TikTok-style).
 * Each child is rendered as a full-width panel.
 * Swiping left/right switches between tabs.
 */
export default function SwipeTabs({ activeIndex, onChangeIndex, children }) {
  const containerRef = useRef(null);
  const touchRef = useRef({ startX: 0, startY: 0, startTime: 0, moved: false, locked: null });
  const [offset, setOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const count = React.Children.count(children);

  // Reset offset when tab changes externally
  useEffect(() => { setOffset(0); }, [activeIndex]);

  const handleTouchStart = useCallback((e) => {
    if (isAnimating) return;
    const touch = e.touches[0];
    touchRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      moved: false,
      locked: null,
    };
  }, [isAnimating]);

  const handleTouchMove = useCallback((e) => {
    if (isAnimating) return;
    const t = touchRef.current;
    const touch = e.touches[0];
    const dx = touch.clientX - t.startX;
    const dy = touch.clientY - t.startY;

    // Lock axis after 8px movement
    if (!t.locked) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        t.locked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      }
      return;
    }

    if (t.locked !== 'x') return;

    // Prevent vertical scrolling while swiping horizontally
    e.preventDefault();
    t.moved = true;

    // Add resistance at edges
    let clampedDx = dx;
    if ((activeIndex === 0 && dx > 0) || (activeIndex === count - 1 && dx < 0)) {
      clampedDx = dx * 0.25;
    }
    setOffset(clampedDx);
  }, [isAnimating, activeIndex, count]);

  const handleTouchEnd = useCallback(() => {
    const t = touchRef.current;
    if (!t.moved || t.locked !== 'x') {
      setOffset(0);
      return;
    }

    const velocity = Math.abs(offset) / Math.max(1, Date.now() - t.startTime);
    const threshold = window.innerWidth * 0.2;
    const shouldSwipe = Math.abs(offset) > threshold || velocity > 0.4;

    if (shouldSwipe) {
      if (offset > 0 && activeIndex > 0) {
        setIsAnimating(true);
        onChangeIndex(activeIndex - 1);
      } else if (offset < 0 && activeIndex < count - 1) {
        setIsAnimating(true);
        onChangeIndex(activeIndex + 1);
      }
    }

    setOffset(0);
    setTimeout(() => setIsAnimating(false), 320);
  }, [offset, activeIndex, count, onChangeIndex]);

  const translateX = -activeIndex * 100;
  const pxOffset = offset;

  return (
    <div
      ref={containerRef}
      className="overflow-hidden touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex"
        style={{
          transform: `translateX(calc(${translateX}% + ${pxOffset}px))`,
          transition: pxOffset === 0 ? 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none',
          willChange: pxOffset !== 0 || isAnimating ? 'transform' : undefined,
        }}
      >
        {React.Children.map(children, (child, i) => (
          <div key={i} className="w-full flex-shrink-0 min-h-[50vh]">
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}