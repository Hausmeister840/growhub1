import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';
import NetworkService from '../services/NetworkService';

export default function NetworkIndicator() {
  const [isOnline, setIsOnline] = useState(NetworkService.getStatus());
  const [showOffline, setShowOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetworkService.addListener((online) => {
      setIsOnline(online);
      if (!online) {
        setShowOffline(true);
      } else {
        // Show "back online" briefly
        setTimeout(() => setShowOffline(false), 3000);
      }
    });

    return unsubscribe;
  }, []);

  if (!showOffline) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className={`fixed top-14 lg:top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg ${
          isOnline 
            ? 'bg-green-600 text-white' 
            : 'bg-red-600 text-white'
        }`}
      >
        <div className="flex items-center gap-2">
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4" />
              <span className="text-sm font-semibold">Wieder online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              <span className="text-sm font-semibold">Keine Verbindung</span>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}