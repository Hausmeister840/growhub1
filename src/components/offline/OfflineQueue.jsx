import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const QUEUE_KEY = 'growhub_offline_queue';

// Safe localStorage wrapper
const safeStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }
};

export function useOfflineQueue() {
  const [queue, setQueue] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadQueue();
    
    // Process queue when online
    window.addEventListener('online', processQueue);
    return () => window.removeEventListener('online', processQueue);
  }, []);

  const loadQueue = () => {
    const stored = safeStorage.getItem(QUEUE_KEY);
    if (stored) {
      try {
        setQueue(JSON.parse(stored));
      } catch {
        setQueue([]);
      }
    }
  };

  const addToQueue = (action) => {
    const newQueue = [...queue, { ...action, id: Date.now(), timestamp: new Date().toISOString() }];
    setQueue(newQueue);
    safeStorage.setItem(QUEUE_KEY, JSON.stringify(newQueue));
    toast.info('Aktion wird später synchronisiert');
  };

  const processQueue = async () => {
    if (isProcessing || queue.length === 0) return;
    if (!navigator.onLine) return;

    setIsProcessing(true);
    const successIds = [];

    for (const action of queue) {
      try {
        switch (action.type) {
          case 'create_post':
            await base44.entities.Post.create(action.data);
            break;
          case 'create_comment':
            await base44.entities.Comment.create(action.data);
            break;
          case 'react':
            // Handle reaction
            break;
          default:
            console.warn('Unknown action type:', action.type);
        }
        successIds.push(action.id);
      } catch (error) {
        console.error('Failed to process queued action:', error);
      }
    }

    if (successIds.length > 0) {
      const remainingQueue = queue.filter(a => !successIds.includes(a.id));
      setQueue(remainingQueue);
      safeStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQueue));
      toast.success(`${successIds.length} Aktion(en) synchronisiert`);
    }

    setIsProcessing(false);
  };

  return { addToQueue, processQueue, queueLength: queue.length };
}

export default function OfflineQueue() {
  useOfflineQueue();
  return null;
}