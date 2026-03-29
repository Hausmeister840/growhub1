import { useState, useEffect, useCallback } from 'react';

/**
 * Ein einfacher Hook für die Listen-Virtualisierung.
 * Rendert nur die Elemente, die aktuell im Viewport sind.
 *
 * @param {object} options
 * @param {number} options.itemCount - Die Gesamtzahl der Elemente in der Liste.
 * @param {number} options.itemHeight - Die geschätzte Höhe jedes Elements.
 * @param {React.RefObject<HTMLElement>} options.parentRef - Ref zum scrollbaren Container.
 * @param {number} [options.overscan=5] - Wie viele zusätzliche Elemente über/unter dem Viewport gerendert werden sollen.
 * @returns {{virtualItems: Array<{index: number, style: React.CSSProperties}>, totalHeight: number}}
 */
export const useVirtualization = ({
  itemCount,
  itemHeight,
  parentRef,
  overscan = 5
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  const handleScroll = useCallback(() => {
    if (parentRef.current) {
      setScrollTop(parentRef.current.scrollTop);
    }
  }, [parentRef]);

  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    handleScroll(); // Initial scroll position
    setViewportHeight(parent.clientHeight);

    parent.addEventListener('scroll', handleScroll, { passive: true });

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setViewportHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(parent);

    return () => {
      parent.removeEventListener('scroll', handleScroll);
      resizeObserver.unobserve(parent);
    };
  }, [parentRef, handleScroll]);


  const totalHeight = itemCount * itemHeight;
  
  let startIndex = Math.floor(scrollTop / itemHeight);
  let endIndex = Math.min(
    itemCount - 1,
    Math.floor((scrollTop + viewportHeight) / itemHeight)
  );

  // Overscan hinzufügen
  startIndex = Math.max(0, startIndex - overscan);
  endIndex = Math.min(itemCount - 1, endIndex + overscan);

  const virtualItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    virtualItems.push({
      index: i,
      style: {
        position: 'absolute',
        top: `${i * itemHeight}px`,
        width: '100%',
        minHeight: `${itemHeight}px`,
      },
    });
  }

  return { virtualItems, totalHeight };
};

export default useVirtualization;