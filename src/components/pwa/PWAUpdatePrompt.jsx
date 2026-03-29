import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from './usePWA';

/**
 * 🔄 PWA UPDATE PROMPT
 * Banner für App-Updates
 */

export default function PWAUpdatePrompt() {
  const { updateAvailable, update } = usePWA();
  const [dismissed, setDismissed] = React.useState(false);

  if (!updateAvailable || dismissed) return null;

  const handleUpdate = async () => {
    await update();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-6 md:w-96"
      >
        <div className="bg-gradient-to-br from-blue-900/90 to-blue-950/90 border border-blue-700 rounded-2xl p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <RefreshCw className="w-6 h-6 text-blue-400" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-bold text-white mb-1">
                Update verfügbar
              </h3>
              <p className="text-sm text-blue-200 mb-4">
                Eine neue Version von GrowHub ist verfügbar
              </p>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleUpdate}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Jetzt aktualisieren
                </Button>
                
                <Button
                  onClick={() => setDismissed(true)}
                  variant="ghost"
                  size="sm"
                  className="px-3 text-white hover:text-white/80"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}