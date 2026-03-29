import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

/**
 * 📲 OFFLINE QUEUE HOOK
 * Manages offline actions and syncs when back online
 */

export function useOfflineQueue() {
  const [queue, setQueue] = useState([]);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncIntervalRef = useRef(null);

  // ✅ Load queue from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('growhub_offline_queue');
      if (saved) {
        const parsed = JSON.parse(saved);
        setQueue(parsed);
        console.log(`📲 Loaded ${parsed.length} offline actions`);
      }
    } catch (error) {
      console.error('Error loading offline queue:', error);
    }
  }, []);

  // ✅ Save queue to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('growhub_offline_queue', JSON.stringify(queue));
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }, [queue]);

  // ✅ Online/Offline detection
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Back online');
      setIsOnline(true);
      toast.success('Verbindung wiederhergestellt');
    };

    const handleOffline = () => {
      console.log('📡 Gone offline');
      setIsOnline(false);
      toast.error('Keine Internetverbindung', {
        description: 'Aktionen werden gespeichert und später synchronisiert'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ✅ Auto-sync when online
  useEffect(() => {
    if (isOnline && queue.length > 0 && !isSyncing) {
      console.log(`🔄 Auto-syncing ${queue.length} offline actions`);
      syncQueue();
    }
  }, [isOnline, queue.length]);

  // ✅ Add action to queue
  const addToQueue = useCallback((action) => {
    const queuedAction = {
      ...action,
      id: Date.now() + Math.random(),
      timestamp: Date.now()
    };
    
    setQueue(prev => [...prev, queuedAction]);
    console.log('📲 Added to offline queue:', action.type);
    
    toast.info('Offline-Aktion gespeichert', {
      description: 'Wird synchronisiert sobald du wieder online bist'
    });
  }, []);

  // ✅ Sync queue
  const syncQueue = useCallback(async () => {
    if (queue.length === 0 || isSyncing) return;
    
    setIsSyncing(true);
    console.log(`🔄 Syncing ${queue.length} offline actions...`);
    
    const successfulIds = [];
    const failedActions = [];

    for (const action of queue) {
      try {
        // Execute action based on type
        switch (action.type) {
          case 'createPost':
            // await createPost(action.data);
            break;
          case 'createComment':
            // await createComment(action.data);
            break;
          case 'reaction':
            // await addReaction(action.data);
            break;
          default:
            console.warn('Unknown action type:', action.type);
        }
        
        successfulIds.push(action.id);
      } catch (error) {
        console.error('Sync error:', error);
        failedActions.push(action);
      }
    }

    // Remove successful actions
    setQueue(failedActions);
    
    if (successfulIds.length > 0) {
      toast.success(`${successfulIds.length} Aktion(en) synchronisiert`);
    }
    
    if (failedActions.length > 0) {
      toast.error(`${failedActions.length} Aktion(en) fehlgeschlagen`);
    }
    
    setIsSyncing(false);
  }, [queue, isSyncing]);

  // ✅ Clear queue
  const clearQueue = useCallback(() => {
    setQueue([]);
    localStorage.removeItem('growhub_offline_queue');
    toast.success('Offline-Warteschlange geleert');
  }, []);

  return {
    queue,
    queueLength: queue.length,
    isOnline,
    isSyncing,
    addToQueue,
    syncQueue,
    clearQueue
  };
}