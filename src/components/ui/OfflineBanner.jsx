import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';

/**
 * 📡 OFFLINE BANNER
 * Shows when user goes offline
 */

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
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
          className="fixed top-0 left-0 right-0 z-50 pointer-events-none"
        >
          <div className={`
            mx-4 mt-4 p-4 rounded-2xl backdrop-blur-2xl shadow-2xl
            ${isOnline 
              ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30' 
              : 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30'
            }
          `}>
            <div className="flex items-center gap-3">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                ${isOnline ? 'bg-green-500/20' : 'bg-red-500/20'}
              `}>
                {isOnline ? (
                  <Wifi className="w-5 h-5 text-green-400" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-400" />
                )}
              </div>

              <div className="flex-1">
                <h3 className="text-white font-bold text-sm">
                  {isOnline ? 'Wieder online!' : 'Keine Verbindung'}
                </h3>
                <p className="text-zinc-300 text-xs">
                  {isOnline 
                    ? 'Verbindung wiederhergestellt' 
                    : 'Einige Funktionen sind eingeschränkt'
                  }
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}