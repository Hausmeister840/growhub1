import { useState, useRef, useCallback, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const startY = useRef(0);
  const startX = useRef(0);
  const isActive = useRef(false);
  const directionLocked = useRef(null); // 'vertical' | 'horizontal' | null
  const pullAmountRef = useRef(0);
  const rafRef = useRef(null);
  const threshold = 80;

  const flushPullToState = useCallback(() => {
    rafRef.current = null;
    setPullDistance(pullAmountRef.current);
  }, []);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const handleTouchStart = useCallback((e) => {
    // Only activate when at top of page and not refreshing
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop > 5 || isRefreshing) return;
    startY.current = e.touches[0].clientY;
    startX.current = e.touches[0].clientX;
    isActive.current = true;
    directionLocked.current = null;
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e) => {
    if (!isActive.current || isRefreshing) return;
    // If user scrolled down since touch start, cancel
    if (window.scrollY > 5) {
      isActive.current = false;
      pullAmountRef.current = 0;
      setPullDistance(0);
      return;
    }

    const dy = e.touches[0].clientY - startY.current;
    const dx = e.touches[0].clientX - startX.current;

    // Lock direction on first significant movement
    if (directionLocked.current === null && (Math.abs(dy) > 8 || Math.abs(dx) > 8)) {
      directionLocked.current = Math.abs(dy) > Math.abs(dx) ? 'vertical' : 'horizontal';
    }

    // Only handle vertical pull-down, let horizontal pass through
    if (directionLocked.current !== 'vertical' || dy <= 0) {
      return;
    }

    e.preventDefault();
    pullAmountRef.current = Math.min(dy, threshold * 1.5);
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(flushPullToState);
    }
  }, [isRefreshing, flushPullToState]);

  const handleTouchEnd = useCallback(async () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const wasActive = isActive.current;
    isActive.current = false;
    directionLocked.current = null;

    const finalPull = pullAmountRef.current;
    pullAmountRef.current = 0;
    setPullDistance(0);

    if (!wasActive) return;

    if (finalPull >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh?.();
      } finally {
        setIsRefreshing(false);
      }
    }
  }, [isRefreshing, onRefresh]);

  const rotation = Math.min((pullDistance / threshold) * 360, 360);
  const opacity = Math.min(pullDistance / threshold, 1);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative touch-pan-y"
    >
      {(pullDistance > 0 || isRefreshing) && (
        <div className="fixed top-20 lg:top-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ 
            opacity: isRefreshing ? 1 : opacity, 
            y: isRefreshing ? 0 : -20 
          }}
          className="flex flex-col items-center justify-center gap-2 pointer-events-auto"
        >
          <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-full p-4 shadow-2xl">
            <RefreshCw
              className={`w-6 h-6 text-green-500 ${isRefreshing ? 'animate-spin' : ''}`}
              style={{ transform: isRefreshing ? 'none' : `rotate(${rotation}deg)` }}
            />
          </div>
          {pullDistance >= threshold && !isRefreshing && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-green-400 font-semibold bg-zinc-900/95 backdrop-blur-xl px-3 py-1 rounded-full"
            >
              Loslassen zum Aktualisieren
            </motion.p>
          )}
          {isRefreshing && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-zinc-400 font-semibold bg-zinc-900/95 backdrop-blur-xl px-3 py-1 rounded-full"
            >
              Wird aktualisiert...
            </motion.p>
          )}
        </motion.div>
        </div>
      )}
      
      <div
        style={
          pullDistance > 0
            ? {
                transform: `translateY(${Math.min(pullDistance * 0.4, threshold * 0.4)}px)`,
                willChange: 'transform',
              }
            : undefined
        }
      >
        {children}
      </div>
    </div>
  );
}