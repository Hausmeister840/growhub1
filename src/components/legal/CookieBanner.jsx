import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Cookie, X, Settings, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    const consent = localStorage.getItem('growhub_cookie_consent');
    if (!consent) {
      setShowBanner(true);
    } else {
      try {
        setPreferences(JSON.parse(consent));
      } catch (e) {
        setShowBanner(true);
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true
    };
    localStorage.setItem('growhub_cookie_consent', JSON.stringify(allAccepted));
    setPreferences(allAccepted);
    setShowBanner(false);
  };

  const handleAcceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false
    };
    localStorage.setItem('growhub_cookie_consent', JSON.stringify(necessaryOnly));
    setPreferences(necessaryOnly);
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('growhub_cookie_consent', JSON.stringify(preferences));
    setShowBanner(false);
    setShowSettings(false);
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-[9999] p-4 pb-20 lg:pb-4"
      >
        <div className="max-w-6xl mx-auto bg-zinc-900/95 backdrop-blur-2xl border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden">
          {!showSettings ? (
            <div className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <Cookie className="w-6 h-6 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">
                    🍪 Wir verwenden Cookies
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Wir nutzen Cookies, um deine Erfahrung zu verbessern, Inhalte zu personalisieren und unsere Dienste zu analysieren. 
                    Durch Nutzung unserer Website stimmst du unserer{' '}
                    <Link to={createPageUrl('Privacy')} className="text-green-400 hover:text-green-300 underline">
                      Datenschutzerklärung
                    </Link>{' '}
                    zu.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleAcceptNecessary}
                  variant="outline"
                  className="flex-1 border-zinc-600 bg-zinc-800 text-white hover:bg-zinc-700"
                >
                  Nur notwendige
                </Button>
                <Button
                  onClick={() => setShowSettings(true)}
                  variant="outline"
                  className="flex-1 border-zinc-600 bg-zinc-800 text-white hover:bg-zinc-700"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Einstellungen
                </Button>
                <Button
                  onClick={handleAcceptAll}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold"
                >
                  Alle akzeptieren
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-green-400" />
                  Cookie-Einstellungen
                </h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="p-4 bg-zinc-800/50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-400" />
                      <span className="font-semibold text-white">Notwendige Cookies</span>
                    </div>
                    <span className="text-xs text-green-400 font-bold">Immer aktiv</span>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Erforderlich für die Grundfunktionen der Website (Login, Session, etc.)
                  </p>
                </div>

                {[
                  { key: 'functional', label: 'Funktionale Cookies', desc: 'Für erweiterte Features wie Sprache, Theme, etc.' },
                  { key: 'analytics', label: 'Analyse Cookies', desc: 'Helfen uns die App zu verbessern' },
                  { key: 'marketing', label: 'Marketing Cookies', desc: 'Für personalisierte Werbung' }
                ].map(({ key, label, desc }) => (
                  <div key={key} className="p-4 bg-zinc-800/30 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white">{label}</span>
                      <button
                        onClick={() => setPreferences(p => ({ ...p, [key]: !p[key] }))}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          preferences[key] ? 'bg-green-500' : 'bg-zinc-700'
                        }`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                            preferences[key] ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-sm text-zinc-400">{desc}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowSettings(false)}
                  variant="outline"
                  className="flex-1 border-zinc-700"
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handleSavePreferences}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  Speichern
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}