import { useRef, useCallback } from 'react';

/**
 * useLongPress hook - triggers callback after holding for `delay` ms.
 * Returns { onTouchStart, onTouchEnd, onTouchMove, onMouseDown, onMouseUp, onMouseLeave }
 * 
 * Cancels if finger moves more than 10px (prevents false triggers during scroll).
 */
export default function useLongPress(callback, { delay = 400 } = {}) {
  const timerRef = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const triggeredRef = useRef(false);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback((x, y) => {
    clear();
    triggeredRef.current = false;
    startPos.current = { x, y };
    timerRef.current = setTimeout(() => {
      triggeredRef.current = true;
      callback?.();
    }, delay);
  }, [callback, delay, clear]);

  const move = useCallback((x, y) => {
    const dx = Math.abs(x - startPos.current.x);
    const dy = Math.abs(y - startPos.current.y);
    if (dx > 10 || dy > 10) {
      clear();
    }
  }, [clear]);

  const onTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    start(touch.clientX, touch.clientY);
  }, [start]);

  const onTouchMove = useCallback((e) => {
    const touch = e.touches[0];
    move(touch.clientX, touch.clientY);
  }, [move]);

  const onTouchEnd = useCallback(() => {
    clear();
  }, [clear]);

  const onMouseDown = useCallback((e) => {
    start(e.clientX, e.clientY);
  }, [start]);

  const onMouseUp = useCallback(() => { clear(); }, [clear]);
  const onMouseLeave = useCallback(() => { clear(); }, [clear]);

  const onClick = useCallback((e) => {
    if (triggeredRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onMouseDown,
    onMouseUp,
    onMouseLeave,
    onClick,
    wasLongPress: () => triggeredRef.current,
  };
}