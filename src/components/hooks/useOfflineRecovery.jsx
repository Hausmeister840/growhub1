import { useEffect, useState } from 'react';
import offlineRecovery from '../services/OfflineRecovery';

/**
 * ✅ USE OFFLINE RECOVERY HOOK
 * Automatically handles network reconnection and triggers recovery
 */
export default function useOfflineRecovery(onRecover) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Subscribe to status changes
    const unsubOnline = offlineRecovery.subscribe('online', () => {
      setIsOnline(true);
    });

    const unsubOffline = offlineRecovery.subscribe('offline', () => {
      setIsOnline(false);
    });

    // Register recovery callback
    let unsubRecover;
    if (onRecover && typeof onRecover === 'function') {
      unsubRecover = offlineRecovery.onRecover(onRecover);
    }

    return () => {
      unsubOnline();
      unsubOffline();
      if (unsubRecover) {
        unsubRecover();
      }
    };
  }, [onRecover]);

  return { isOnline };
}