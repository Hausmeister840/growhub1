import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, Database } from 'lucide-react';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className={`fixed top-14 lg:top-4 left-4 right-4 z-50 lg:left-auto lg:right-4 lg:w-80 ${
            isOnline ? 'bg-green-500/90' : 'bg-zinc-800/95'
          } backdrop-blur-xl rounded-2xl p-4 shadow-2xl border ${isOnline ? 'border-green-400/30' : 'border-zinc-700'}`}
        >
          <div className="flex items-center gap-3">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-white" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-400" />
            )}
            <div className="flex-1">
              <p className="text-white font-bold text-sm">
                {isOnline ? 'Wieder online!' : 'Offline-Modus'}
              </p>
              <p className="text-white/70 text-xs">
                {isOnline 
                  ? 'Daten werden synchronisiert...' 
                  : 'Feed aus dem Cache geladen'
                }
              </p>
            </div>
            {!isOnline && (
              <Database className="w-4 h-4 text-zinc-400" />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}