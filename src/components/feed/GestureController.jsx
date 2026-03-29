import { useEffect, useRef } from 'react';

export default function GestureController({ onSwipeDown, onSwipeUp }) {
  const touchStart = useRef(null);
  const touchEnd = useRef(null);

  useEffect(() => {
    const minSwipeDistance = 100;

    const onTouchStart = (e) => {
      touchEnd.current = null;
      touchStart.current = e.targetTouches[0].clientY;
    };

    const onTouchMove = (e) => {
      touchEnd.current = e.targetTouches[0].clientY;
    };

    const onTouchEnd = () => {
      if (!touchStart.current || !touchEnd.current) return;
      
      const distance = touchStart.current - touchEnd.current;
      const isDownSwipe = distance < -minSwipeDistance;
      const isUpSwipe = distance > minSwipeDistance;

      if (isDownSwipe && window.scrollY === 0 && onSwipeDown) {
        onSwipeDown();
      }
      
      if (isUpSwipe && onSwipeUp) {
        onSwipeUp();
      }
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd);

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [onSwipeDown, onSwipeUp]);

  return null;
}