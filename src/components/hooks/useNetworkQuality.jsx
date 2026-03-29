import { useState, useEffect } from 'react';

/**
 * Network Quality Detection Hook
 * Detects connection speed and adjusts quality accordingly
 */
export function useNetworkQuality() {
  const [quality, setQuality] = useState('high'); // high, medium, low
  const [effectiveType, setEffectiveType] = useState('4g');
  const [saveData, setSaveData] = useState(false);

  useEffect(() => {
    const updateNetworkInfo = () => {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      if (!connection) {
        setQuality('high');
        return;
      }

      setSaveData(connection.saveData || false);
      setEffectiveType(connection.effectiveType || '4g');

      // Determine quality based on connection
      if (connection.saveData) {
        setQuality('low');
      } else if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        setQuality('low');
      } else if (connection.effectiveType === '3g') {
        setQuality('medium');
      } else {
        setQuality('high');
      }
    };

    updateNetworkInfo();

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
      return () => connection.removeEventListener('change', updateNetworkInfo);
    }
  }, []);

  return {
    quality,
    effectiveType,
    saveData,
    isSlowConnection: quality === 'low',
    shouldReduceQuality: quality !== 'high'
  };
}