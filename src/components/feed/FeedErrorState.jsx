import { Button } from '@/components/ui/button';
import { AlertTriangle, Wifi, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * ⚠️ FEED ERROR STATE
 * Benutzerfreundliche Fehleranzeige
 */

export default function FeedErrorState({ isOffline, onRetry }) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          {isOffline ? (
            <Wifi className="w-10 h-10 text-red-400" />
          ) : (
            <AlertTriangle className="w-10 h-10 text-red-400" />
          )}
        </div>

        <h2 className="text-2xl font-bold text-white mb-3">
          {isOffline ? 'Keine Verbindung' : 'Etwas ist schiefgelaufen'}
        </h2>

        <p className="text-zinc-400 mb-8">
          {isOffline 
            ? 'Bitte überprüfe deine Internetverbindung und versuche es erneut.'
            : 'Der Feed konnte nicht geladen werden. Bitte versuche es erneut.'
          }
        </p>

        <Button
          onClick={onRetry}
          className="bg-green-500 hover:bg-green-600 text-white font-bold"
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          Erneut versuchen
        </Button>
      </motion.div>
    </div>
  );
}