import { useEffect, useRef, useCallback } from 'react';
import feedPreloader from '../services/AggressiveFeedPreloader';

/**
 * 🎯 ADAPTIVE PRELOADING HOOK
 * Nutzt Network Information API + Battery API für intelligentes Preloading
 */
export function useAdaptivePreloading() {
  const connectionRef = useRef(null);
  const batteryRef = useRef(null);

  useEffect(() => {
    // Detect connection type
    if ('connection' in navigator || 'mozConnection' in navigator || 'webkitConnection' in navigator) {
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      connectionRef.current = conn;

      const handleConnectionChange = () => {
        const effectiveType = conn.effectiveType;
        feedPreloader.adjustForConnection(effectiveType);
        
        // Bei sehr langsamer Verbindung: Pause
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          feedPreloader.pausePreloading();
        }
      };

      conn.addEventListener('change', handleConnectionChange);
      handleConnectionChange(); // Initial

      return () => conn.removeEventListener('change', handleConnectionChange);
    }
  }, []);

  useEffect(() => {
    // Battery API
    let cleanup = null;
    
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        batteryRef.current = battery;

        const handleBatteryChange = () => {
          // Bei < 20% Battery: Reduziere Preloading
          if (battery.level < 0.2 && !battery.charging) {
            feedPreloader.adjustForConnection('3g'); // Konservativ
          }
          
          // Bei < 10%: Stop
          if (battery.level < 0.1 && !battery.charging) {
            feedPreloader.pausePreloading();
          }
        };

        battery.addEventListener('levelchange', handleBatteryChange);
        battery.addEventListener('chargingchange', handleBatteryChange);

        cleanup = () => {
          battery.removeEventListener('levelchange', handleBatteryChange);
          battery.removeEventListener('chargingchange', handleBatteryChange);
        };
      });
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  const getConnectionQuality = useCallback(() => {
    const conn = connectionRef.current;
    if (!conn) return 'good';

    const type = conn.effectiveType;
    if (type === '4g' || type === 'wifi') return 'excellent';
    if (type === '3g') return 'good';
    if (type === '2g') return 'poor';
    return 'good';
  }, []);

  const shouldPreloadVideos = useCallback(() => {
    const quality = getConnectionQuality();
    const battery = batteryRef.current;

    // Nur bei guter Verbindung UND genug Akku
    return quality !== 'poor' && (!battery || battery.level > 0.3 || battery.charging);
  }, [getConnectionQuality]);

  return {
    getConnectionQuality,
    shouldPreloadVideos
  };
}