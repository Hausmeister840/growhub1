import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, Wifi, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/**
 * ⚠️ ERROR STATE COMPONENT
 * Benutzerfreundliche Error-Anzeige mit Actions
 */

const ERROR_TYPES = {
  network: {
    icon: Wifi,
    title: 'Keine Verbindung',
    description: 'Bitte überprüfe deine Internetverbindung',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30'
  },
  auth: {
    icon: AlertTriangle,
    title: 'Authentifizierung fehlgeschlagen',
    description: 'Bitte melde dich erneut an',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30'
  },
  notFound: {
    icon: AlertTriangle,
    title: 'Nicht gefunden',
    description: 'Die angeforderte Ressource existiert nicht',
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-800/50',
    borderColor: 'border-zinc-700'
  },
  server: {
    icon: Bug,
    title: 'Server-Fehler',
    description: 'Ein unerwarteter Fehler ist aufgetreten',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30'
  },
  generic: {
    icon: AlertTriangle,
    title: 'Etwas ist schiefgelaufen',
    description: 'Bitte versuche es erneut',
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-800/50',
    borderColor: 'border-zinc-700'
  }
};

export default function ErrorState({
  type = 'generic',
  title,
  description,
  error,
  onRetry,
  onGoHome,
  showDetails = false,
  className = ''
}) {
  const errorConfig = ERROR_TYPES[type] || ERROR_TYPES.generic;
  const Icon = errorConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center justify-center min-h-[400px] p-6 ${className}`}
    >
      <Card className={`max-w-md w-full p-8 text-center ${errorConfig.bgColor} ${errorConfig.borderColor} border`}>
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${errorConfig.bgColor}`}
        >
          <Icon className={`w-8 h-8 ${errorConfig.color}`} />
        </motion.div>

        {/* Title & Description */}
        <h2 className="text-xl font-bold text-white mb-3">
          {title || errorConfig.title}
        </h2>
        <p className="text-zinc-400 mb-6">
          {description || errorConfig.description}
        </p>

        {/* Error Details (Development) */}
        {showDetails && error && (
          <Card className="p-4 mb-6 bg-zinc-900/50 border-zinc-800 text-left">
            <p className="text-xs font-mono text-red-400 break-all">
              {error.message || String(error)}
            </p>
            {error.stack && (
              <details className="mt-2">
                <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-400">
                  Stack Trace
                </summary>
                <pre className="text-xs text-zinc-600 mt-2 overflow-x-auto">
                  {error.stack}
                </pre>
              </details>
            )}
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onRetry && (
            <Button
              onClick={onRetry}
              className="bg-green-600 hover:bg-green-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Erneut versuchen
            </Button>
          )}
          {onGoHome && (
            <Button
              onClick={onGoHome}
              variant="outline"
              className="border-zinc-700 hover:bg-zinc-800"
            >
              <Home className="w-4 h-4 mr-2" />
              Zur Startseite
            </Button>
          )}
        </div>

        {/* Help Text */}
        <p className="text-xs text-zinc-600 mt-6">
          Problem besteht weiterhin?{' '}
          <button className="text-green-400 hover:underline">
            Support kontaktieren
          </button>
        </p>
      </Card>
    </motion.div>
  );
}