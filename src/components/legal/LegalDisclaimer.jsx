import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * ⚖️ LEGAL DISCLAIMER
 * Rechtliche Hinweise für Deutschland
 */

export default function LegalDisclaimer({ variant = 'banner', onAccept }) {
  const [isVisible, setIsVisible] = useState(true);
  const [hasRead, setHasRead] = useState(false);

  if (!isVisible) return null;

  const handleAccept = () => {
    setIsVisible(false);
    onAccept?.();
    localStorage.setItem('growhub_legal_accepted', new Date().toISOString());
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setHasRead(true);
    }
  };

  if (variant === 'modal') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Rechtliche Hinweise
                  </h2>
                  <p className="text-sm text-zinc-400">
                    Bitte aufmerksam lesen
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div 
              className="p-6 space-y-4 overflow-y-auto max-h-[50vh]"
              onScroll={handleScroll}
            >
              {/* Cannabis-Gesetz */}
              <div className="bg-zinc-800/50 rounded-xl p-4">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                  Konsumcannabisgesetz (KCanG)
                </h3>
                <ul className="text-sm text-zinc-300 space-y-1 ml-7">
                  <li>• Mindestalter: 18 Jahre</li>
                  <li>• Besitzlimit: 25g in der Öffentlichkeit, 50g zu Hause</li>
                  <li>• Anbau: Max. 3 Pflanzen pro Person</li>
                  <li>• Konsumverbot in Sichtweite von Schulen, Kindergärten, Spielplätzen</li>
                  <li>• Fußgängerzonen: 07:00-20:00 Uhr verboten</li>
                </ul>
              </div>

              {/* Platform Rules */}
              <div className="bg-zinc-800/50 rounded-xl p-4">
                <h3 className="font-bold text-white mb-2">
                  Platform-Regeln
                </h3>
                <ul className="text-sm text-zinc-300 space-y-1">
                  <li>• Kein Verkauf illegaler Substanzen</li>
                  <li>• Keine Anleitungen zu illegalen Aktivitäten</li>
                  <li>• Respektvolles Miteinander</li>
                  <li>• Keine Inhalte für unter 18-Jährige</li>
                  <li>• Content Moderation aktiv</li>
                </ul>
              </div>

              {/* Medical Disclaimer */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <h3 className="font-bold text-blue-400 mb-2">
                  Medizinischer Haftungsausschluss
                </h3>
                <p className="text-sm text-zinc-300">
                  Die Informationen auf dieser Platform sind kein Ersatz für professionelle 
                  medizinische Beratung. Konsultiere immer einen Arzt vor medizinischer Cannabis-Nutzung.
                </p>
              </div>

              {/* Privacy */}
              <div className="bg-zinc-800/50 rounded-xl p-4">
                <h3 className="font-bold text-white mb-2">
                  Datenschutz & Privatsphäre
                </h3>
                <p className="text-sm text-zinc-300 mb-2">
                  Wir erheben Standortdaten nur zur NoGo-Zonen-Warnung. 
                  Alle Daten werden DSGVO-konform verarbeitet.
                </p>
                <a 
                  href="/Privacy" 
                  className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1"
                >
                  Datenschutzerklärung lesen
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={hasRead}
                    onChange={(e) => setHasRead(e.target.checked)}
                    className="rounded border-zinc-700"
                  />
                  Ich habe alles gelesen und verstanden
                </label>

                <Button
                  onClick={handleAccept}
                  disabled={!hasRead}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Akzeptieren
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Banner variant
  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800 p-4"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0" />
          <div>
            <p className="text-sm text-white font-medium">
              Rechtlicher Hinweis
            </p>
            <p className="text-xs text-zinc-400">
              Diese Platform ist nur für Personen 18+ und folgt dem deutschen KCanG.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsVisible(false)}
          >
            Details
          </Button>
          <Button
            size="sm"
            onClick={handleAccept}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            Verstanden
          </Button>
        </div>
      </div>
    </motion.div>
  );
}