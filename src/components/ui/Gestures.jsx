import { useRef, useCallback } from 'react';

/**
 * 👆 GESTURE HANDLERS - Swipe, Pinch, DoubleTap
 */

export function useSwipeGesture({ 
  onSwipeLeft, 
  onSwipeRight, 
  onSwipeUp, 
  onSwipeDown,
  threshold = 50,
  velocityThreshold = 0.3
}) {
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });

  const handleTouchStart = useCallback((e) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    };
  }, []);

  const handleTouchEnd = useCallback((e) => {
    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
      time: Date.now()
    };

    const deltaX = touchEnd.x - touchStartRef.current.x;
    const deltaY = touchEnd.y - touchStartRef.current.y;
    const deltaTime = touchEnd.time - touchStartRef.current.time;

    const velocityX = Math.abs(deltaX) / deltaTime;
    const velocityY = Math.abs(deltaY) / deltaTime;

    // Horizontal swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
      if (velocityX > velocityThreshold) {
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      }
    }
    // Vertical swipe
    else if (Math.abs(deltaY) > threshold) {
      if (velocityY > velocityThreshold) {
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, velocityThreshold]);

  return { handleTouchStart, handleTouchEnd };
}

export function useDoubleTap({ onDoubleTap, delay = 300 }) {
  const lastTapRef = useRef(0);

  const handleTap = useCallback(() => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < delay && timeSinceLastTap > 0) {
      onDoubleTap?.();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, [onDoubleTap, delay]);

  return { handleTap };
}

export function usePinchZoom({ onPinch, minScale = 0.5, maxScale = 3 }) {
  const initialDistanceRef = useRef(0);
  const currentScaleRef = useRef(1);

  const getDistance = (touch1, touch2) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      initialDistanceRef.current = getDistance(e.touches[0], e.touches[1]);
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && initialDistanceRef.current > 0) {
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / initialDistanceRef.current;
      
      currentScaleRef.current = Math.max(minScale, Math.min(maxScale, scale));
      onPinch?.(currentScaleRef.current);
    }
  }, [onPinch, minScale, maxScale]);

  const handleTouchEnd = useCallback(() => {
    initialDistanceRef.current = 0;
  }, []);

  return { handleTouchStart, handleTouchMove, handleTouchEnd };
}

export function useLongPress({ onLongPress, delay = 500 }) {
  const timeoutRef = useRef(null);
  const isPressedRef = useRef(false);

  const handleStart = useCallback(() => {
    isPressedRef.current = true;
    timeoutRef.current = setTimeout(() => {
      if (isPressedRef.current) {
        onLongPress?.();
      }
    }, delay);
  }, [onLongPress, delay]);

  const handleEnd = useCallback(() => {
    isPressedRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return { handleStart, handleEnd };
}