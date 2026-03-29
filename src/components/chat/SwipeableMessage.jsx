import { useRef, useCallback } from 'react';
import { Reply } from 'lucide-react';

/**
 * Wraps a message bubble to enable swipe-to-reply on mobile.
 * Swipe right on other's messages, swipe left on own messages.
 */
export default function SwipeableMessage({ children, isOwn, onSwipe }) {
  const startX = useRef(0);
  const currentX = useRef(0);
  const swiping = useRef(false);
  const elRef = useRef(null);
  const triggered = useRef(false);

  const onTouchStart = useCallback((e) => {
    startX.current = e.touches[0].clientX;
    currentX.current = 0;
    swiping.current = false;
    triggered.current = false;
  }, []);

  const onTouchMove = useCallback((e) => {
    const dx = e.touches[0].clientX - startX.current;
    // Only allow swipe in the correct direction
    const validDirection = isOwn ? dx < 0 : dx > 0;
    if (!validDirection && !swiping.current) return;

    const absDx = Math.abs(dx);
    if (absDx < 8) return;
    swiping.current = true;

    const clamped = Math.max(-80, Math.min(80, dx));
    currentX.current = clamped;

    if (elRef.current) {
      elRef.current.style.transform = `translateX(${clamped}px)`;
      elRef.current.style.transition = 'none';
    }

    if (absDx > 60 && !triggered.current) {
      triggered.current = true;
      if (navigator.vibrate) navigator.vibrate(10);
    }
  }, [isOwn]);

  const onTouchEnd = useCallback(() => {
    if (elRef.current) {
      elRef.current.style.transform = 'translateX(0)';
      elRef.current.style.transition = 'transform 0.2s ease-out';
    }
    if (triggered.current && onSwipe) {
      onSwipe();
    }
    swiping.current = false;
    triggered.current = false;
  }, [onSwipe]);

  return (
    <div className="relative overflow-visible">
      {/* Reply icon hint */}
      <div className={`absolute top-1/2 -translate-y-1/2 ${isOwn ? 'left-2' : 'right-2'} opacity-30 pointer-events-none`}>
        <Reply className="w-4 h-4 text-zinc-400" />
      </div>
      <div
        ref={elRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ willChange: 'transform' }}
      >
        {children}
      </div>
    </div>
  );
}