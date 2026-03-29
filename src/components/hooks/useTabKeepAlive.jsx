import { useState, useRef, useCallback } from 'react';

/**
 * 🔄 TAB KEEP ALIVE HOOK
 * Keeps tab content mounted but hidden for instant switching
 */

export function useTabKeepAlive(initialTab) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const visitedTabs = useRef(new Set([initialTab]));

  const switchTab = useCallback((newTab) => {
    visitedTabs.current.add(newTab);
    setActiveTab(newTab);
  }, []);

  const shouldRender = useCallback((tab) => {
    return visitedTabs.current.has(tab);
  }, []);

  const isActive = useCallback((tab) => {
    return activeTab === tab;
  }, [activeTab]);

  return {
    activeTab,
    switchTab,
    shouldRender,
    isActive
  };
}

export default useTabKeepAlive;