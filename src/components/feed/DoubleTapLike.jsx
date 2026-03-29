import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';

export default function DoubleTapLike({ onDoubleTap, children }) {
  const [heartPos, setHeartPos] = useState(null);
  const lastTapRef = useRef(0);

  const handleTap = useCallback((e) => {
    const now = Date.now();
    const delta = now - lastTapRef.current;
    lastTapRef.current = now;

    if (delta < 300) {
      // Double tap detected
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.touches?.[0]?.clientX ?? e.clientX) - rect.left;
      const y = (e.touches?.[0]?.clientY ?? e.clientY) - rect.top;
      setHeartPos({ x, y, id: now });
      onDoubleTap?.();
      if (navigator.vibrate) navigator.vibrate([8, 20, 8]);
    }
  }, [onDoubleTap]);

  return (
    <div
      className="relative select-none"
      onClick={handleTap}
      onTouchEnd={handleTap}
    >
      {children}
      <AnimatePresence>
        {heartPos && (
          <motion.div
            key={heartPos.id}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: [0, 1.4, 1.2], opacity: [1, 1, 0] }}
            transition={{ duration: 0.7, times: [0, 0.4, 1] }}
            onAnimationComplete={() => setHeartPos(null)}
            className="absolute pointer-events-none z-50"
            style={{ left: heartPos.x - 28, top: heartPos.y - 28 }}
          >
            <Heart className="w-14 h-14 fill-red-500 text-red-500 drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}