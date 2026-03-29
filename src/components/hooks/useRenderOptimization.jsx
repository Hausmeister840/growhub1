import { useRef, useEffect } from 'react';

/**
 * Render Optimization Hook
 * Tracks and optimizes component re-renders
 */
export function useRenderOptimization(componentName) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;

    if (process.env.NODE_ENV === 'development') {
      if (timeSinceLastRender < 16) {
        console.warn(`${componentName} rendered ${renderCount.current} times, last render: ${timeSinceLastRender}ms ago`);
      }
    }

    lastRenderTime.current = now;
  });

  return renderCount.current;
}