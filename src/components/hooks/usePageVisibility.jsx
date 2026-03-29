import { useState, useEffect } from 'react';
import VisibilityManager from '../services/VisibilityManager';

/**
 * Page Visibility Hook
 * Tracks page visibility state
 */
export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(VisibilityManager.getState().isVisible);

  useEffect(() => {
    const unsubscribe = VisibilityManager.addListener((visible) => {
      setIsVisible(visible);
    });

    return unsubscribe;
  }, []);

  return isVisible;
}