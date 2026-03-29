import React from 'react';
import { motion } from 'framer-motion';

/**
 * 👆 TOUCH FEEDBACK
 * Haptisches Feedback für Touch-Interaktionen
 */

export function TouchFeedback({ children, onTap, intensity = 'medium', className = '', ...props }) {
  const handleTap = (e) => {
    // Haptic feedback (iOS/Android)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      const duration = intensity === 'light' ? 10 : intensity === 'medium' ? 20 : 30;
      navigator.vibrate(duration);
    }

    onTap?.(e);
  };

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.1 }}
      onTapStart={handleTap}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function LongPressFeedback({ children, onLongPress, duration = 500, className = '' }) {
  const [pressing, setPressing] = React.useState(false);
  const timeoutRef = React.useRef(null);

  const handlePressStart = () => {
    setPressing(true);
    
    timeoutRef.current = setTimeout(() => {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
      onLongPress?.();
    }, duration);
  };

  const handlePressEnd = () => {
    setPressing(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  return (
    <motion.div
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      animate={{ scale: pressing ? 0.95 : 1 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SwipeFeedback({ children, onSwipeLeft, onSwipeRight, threshold = 50, className = '' }) {
  const [startX, setStartX] = React.useState(0);
  const [currentX, setCurrentX] = React.useState(0);
  const [isSwiping, setIsSwiping] = React.useState(false);

  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!isSwiping) return;
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;

    const diff = currentX - startX;

    if (Math.abs(diff) > threshold) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(20);
      }

      if (diff > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    }

    setIsSwiping(false);
    setCurrentX(0);
    setStartX(0);
  };

  const offset = isSwiping ? currentX - startX : 0;

  return (
    <motion.div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      animate={{ x: offset }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default TouchFeedback;