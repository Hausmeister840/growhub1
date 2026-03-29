import { useState, useCallback, useRef } from 'react';

export const useGestureRecognition = ({ 
  onSwipeUp, 
  onSwipeDown, 
  onSwipeLeft, 
  onSwipeRight,
  onTap,
  onDoubleTap,
  onLongPress,
  threshold = 50,
  velocityThreshold = 0.3
}) => {
  const [gesture, setGesture] = useState(null);
  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);
  const lastTapRef = useRef(0);
  const longPressTimeoutRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };

    // Start long press detection
    longPressTimeoutRef.current = setTimeout(() => {
      onLongPress?.();
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);

    setGesture('start');
  }, [onLongPress]);

  const handleTouchMove = useCallback((e) => {
    if (!touchStartRef.current) return;

    // Cancel long press if moving
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }

    const touch = e.touches[0];
    touchEndRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };

    const deltaX = touchEndRef.current.x - touchStartRef.current.x;
    const deltaY = touchEndRef.current.y - touchStartRef.current.y;

    // Determine gesture direction
    if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        setGesture(deltaX > 0 ? 'swipe-right' : 'swipe-left');
      } else {
        setGesture(deltaY > 0 ? 'swipe-down' : 'swipe-up');
      }
    }
  }, [threshold]);

  const handleTouchEnd = useCallback((e) => {
    // Cancel long press
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }

    if (!touchStartRef.current || !touchEndRef.current) {
      // Simple tap
      const now = Date.now();
      const timeSinceLastTap = now - lastTapRef.current;
      
      if (timeSinceLastTap < 300) {
        // Double tap
        onDoubleTap?.();
        if (navigator.vibrate) navigator.vibrate([30, 30, 60]);
      } else {
        // Single tap (with delay to check for double tap)
        setTimeout(() => {
          if (Date.now() - lastTapRef.current > 300) {
            onTap?.();
          }
        }, 300);
      }
      
      lastTapRef.current = now;
      return;
    }

    const deltaX = touchEndRef.current.x - touchStartRef.current.x;
    const deltaY = touchEndRef.current.y - touchStartRef.current.y;
    const deltaTime = touchEndRef.current.time - touchStartRef.current.time;
    const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime;

    // Execute gesture callbacks
    if (velocity > velocityThreshold) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > threshold) {
          if (deltaX > 0) {
            onSwipeRight?.();
          } else {
            onSwipeLeft?.();
          }
          if (navigator.vibrate) navigator.vibrate(30);
        }
      } else {
        if (Math.abs(deltaY) > threshold) {
          if (deltaY > 0) {
            onSwipeDown?.();
          } else {
            onSwipeUp?.();
          }
          if (navigator.vibrate) navigator.vibrate(30);
        }
      }
    }

    // Reset
    touchStartRef.current = null;
    touchEndRef.current = null;
    setGesture(null);
  }, [onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight, onTap, onDoubleTap, threshold, velocityThreshold]);

  return {
    gesture,
    gestureHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    }
  };
};