import { useCallback, useRef, useEffect } from 'react';

/**
 * Enhanced hook for managing video visibility with intersection observer
 * and smooth performance optimizations
 */
export const useVideoVisibility = (onVisibilityChange) => {
  const observerRef = useRef(null);
  const visibleItemsRef = useRef(new Set());
  const callbackTimeoutRef = useRef(null);

  // Throttled visibility callback to prevent excessive calls
  const throttledCallback = useCallback((itemId, isVisible, item) => {
    if (callbackTimeoutRef.current) {
      clearTimeout(callbackTimeoutRef.current);
    }
    
    callbackTimeoutRef.current = setTimeout(() => {
      if (onVisibilityChange) {
        onVisibilityChange(itemId, isVisible, item);
      }
    }, 50);
  }, [onVisibilityChange]);

  // Viewability configuration optimized for video content
  const viewabilityConfig = {
    itemVisiblePercentThreshold: 75, // 75% visibility for better UX
    minimumViewTime: 200, // Minimum time item must be visible
    waitForInteraction: false
  };

  // Enhanced intersection observer with performance optimizations
  const createIntersectionObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const changes = [];
        
        entries.forEach((entry) => {
          const element = entry.target;
          const itemId = element.dataset.itemId || element.dataset.postId;
          const index = parseInt(element.dataset.index || '0');
          
          if (!itemId) return;

          const isViewable = entry.intersectionRatio >= (viewabilityConfig.itemVisiblePercentThreshold / 100);
          const wasVisible = visibleItemsRef.current.has(itemId);

          if (isViewable && !wasVisible) {
            // Item became visible
            visibleItemsRef.current.add(itemId);
            changes.push({
              itemId,
              isViewable: true,
              element,
              index
            });
          } else if (!isViewable && wasVisible) {
            // Item became invisible
            visibleItemsRef.current.delete(itemId);
            changes.push({
              itemId,
              isViewable: false,
              element,
              index
            });
          }
        });

        // Batch process changes
        if (changes.length > 0) {
          changes.forEach(({ itemId, isViewable, element, index }) => {
            throttledCallback(itemId, isViewable, {
              id: itemId,
              element,
              index
            });
          });
        }
      },
      {
        root: null, // Use viewport as root
        rootMargin: '20px 0px 20px 0px', // Small margin for smoother transitions
        threshold: [0, 0.25, 0.5, 0.75, 1.0] // Multiple thresholds for better precision
      }
    );

    return observerRef.current;
  }, [viewabilityConfig.itemVisiblePercentThreshold, throttledCallback]);

  // Observe element with enhanced error handling
  const observeElement = useCallback((element, itemId, index = 0) => {
    if (!element || !itemId) return;

    if (!observerRef.current) {
      createIntersectionObserver();
    }

    try {
      // Set data attributes for identification
      element.dataset.itemId = itemId.toString();
      element.dataset.index = index.toString();
      
      // Start observing
      observerRef.current.observe(element);
    } catch (error) {
      console.warn('Failed to observe element:', error);
    }
  }, [createIntersectionObserver]);

  // Stop observing element
  const unobserveElement = useCallback((element) => {
    if (observerRef.current && element) {
      try {
        observerRef.current.unobserve(element);
        
        // Clean up from visible items
        const itemId = element.dataset.itemId;
        if (itemId) {
          visibleItemsRef.current.delete(itemId);
        }
      } catch (error) {
        console.warn('Failed to unobserve element:', error);
      }
    }
  }, []);

  // Update observer threshold dynamically
  const updateThreshold = useCallback((newThreshold) => {
    viewabilityConfig.itemVisiblePercentThreshold = newThreshold;
    if (observerRef.current) {
      createIntersectionObserver();
    }
  }, [createIntersectionObserver]);

  // Get currently visible items
  const getVisibleItems = useCallback(() => {
    return Array.from(visibleItemsRef.current);
  }, []);

  // Manual visibility check for specific element
  const checkElementVisibility = useCallback((element) => {
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    const viewHeight = window.innerHeight;
    const viewWidth = window.innerWidth;

    // Calculate intersection
    const visibleHeight = Math.min(rect.bottom, viewHeight) - Math.max(rect.top, 0);
    const visibleWidth = Math.min(rect.right, viewWidth) - Math.max(rect.left, 0);
    
    if (visibleHeight <= 0 || visibleWidth <= 0) return false;

    const elementArea = rect.width * rect.height;
    const visibleArea = visibleHeight * visibleWidth;
    const visibilityRatio = visibleArea / elementArea;

    return visibilityRatio >= (viewabilityConfig.itemVisiblePercentThreshold / 100);
  }, [viewabilityConfig.itemVisiblePercentThreshold]);

  // Cleanup function
  const disconnect = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    
    if (callbackTimeoutRef.current) {
      clearTimeout(callbackTimeoutRef.current);
      callbackTimeoutRef.current = null;
    }
    
    visibleItemsRef.current.clear();
  }, []);

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Enhanced onViewableItemsChanged for compatibility
  const onViewableItemsChanged = useCallback(({ viewableItems, changed }) => {
    if (changed && changed.length > 0) {
      changed.forEach(({ item, isViewable, index }) => {
        const itemId = item.id || item.key || index;
        
        if (isViewable && !visibleItemsRef.current.has(itemId)) {
          visibleItemsRef.current.add(itemId);
          throttledCallback(itemId, true, item);
        } else if (!isViewable && visibleItemsRef.current.has(itemId)) {
          visibleItemsRef.current.delete(itemId);
          throttledCallback(itemId, false, item);
        }
      });
    }
  }, [throttledCallback]);

  return {
    onViewableItemsChanged,
    viewabilityConfig,
    observeElement,
    unobserveElement,
    updateThreshold,
    getVisibleItems,
    checkElementVisibility,
    disconnect,
    createIntersectionObserver
  };
};