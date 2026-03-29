import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, TrendingUp, Zap, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function PlatformLimitBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Prüfe ob bereits dismissed wurde (localStorage)
  useEffect(() => {
    try {
      const dismissedUntil = localStorage.getItem('growhub_limit_dismissed_until');
      if (dismissedUntil) {
        const dismissedDate = new Date(dismissedUntil);
        if (dismissedDate > new Date()) {
          setDismissed(true);
        }
      }
    } catch (e) {
      console.warn('Could not read dismiss state:', e);
    }
  }, []);

  const handleDismiss = () => {
    try {
      // Dismiss für 24 Stunden
      const dismissUntil = new Date();
      dismissUntil.setHours(dismissUntil.getHours() + 24);
      localStorage.setItem('growhub_limit_dismissed_until', dismissUntil.toISOString());
      setDismissed(true);
    } catch (e) {
      console.warn('Could not save dismiss state:', e);
      setDismissed(true);
    }
  };

  const handleOpenDashboard = () => {
    window.open('https://www.base44.com/dashboard', '_blank');
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-50"
      >
        {/* Kompaktes Info-Banner */}
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 backdrop-blur-md border-b border-amber-500/20">
          <div className="max-w-7xl mx-auto px-4 py-2.5">
            <div className="flex items-center justify-between gap-4">
              {/* Icon + Hauptmessage */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Info className="w-4 h-4 text-amber-400" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-100">
                    Einige Funktionen sind vorübergehend eingeschränkt
                  </p>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-xs text-amber-300/80 hover:text-amber-200 transition-colors underline"
                  >
                    {showDetails ? 'Weniger anzeigen' : 'Mehr erfahren'}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenDashboard}
                  className="text-amber-200 hover:text-amber-100 hover:bg-amber-500/10 text-xs h-8"
                >
                  <Zap className="w-3.5 h-3.5 mr-1.5" />
                  Plan prüfen
                  <ExternalLink className="w-3 h-3 ml-1.5 opacity-60" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismiss}
                  className="h-8 w-8 text-amber-300/60 hover:text-amber-200 hover:bg-amber-500/10"
                  title="Für 24h ausblenden"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Erweiterte Details - Aufklappbar */}
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <Card className="mt-3 bg-black/40 border-amber-500/20 p-4">
                    <div className="space-y-3">
                      {/* Was ist betroffen */}
                      <div>
                        <h4 className="text-xs font-semibold text-amber-200 mb-2 flex items-center gap-2">
                          <Info className="w-3.5 h-3.5" />
                          Betroffene Funktionen:
                        </h4>
                        <ul className="text-xs text-zinc-300 space-y-1.5 ml-5">
                          <li className="list-disc">Reaktionen auf Posts (❤️ 🔥 💡 etc.)</li>
                          <li className="list-disc">Lesezeichen / Bookmarks</li>
                          <li className="list-disc">Einige API-gestützte Features</li>
                        </ul>
                      </div>

                      {/* Warum passiert das */}
                      <div>
                        <h4 className="text-xs font-semibold text-amber-200 mb-2 flex items-center gap-2">
                          <TrendingUp className="w-3.5 h-3.5" />
                          Warum passiert das?
                        </h4>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          GrowHub läuft auf der Base44-Plattform. Dein Account hat die Nutzungsgrenzen 
                          des aktuellen Plans erreicht. Das ist normal bei wachsenden Apps und bedeutet, 
                          dass du GrowHub aktiv nutzt! 🎉
                        </p>
                      </div>

                      {/* Was kannst du tun */}
                      <div>
                        <h4 className="text-xs font-semibold text-amber-200 mb-2 flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5" />
                          Was kannst du tun?
                        </h4>
                        <div className="space-y-2">
                          <Button
                            onClick={handleOpenDashboard}
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs h-9"
                          >
                            <ExternalLink className="w-3.5 h-3.5 mr-2" />
                            Base44 Dashboard öffnen & Plan upgraden
                          </Button>
                          <p className="text-[10px] text-zinc-400 text-center">
                            Im Dashboard kannst du deinen Plan anpassen oder Limits erhöhen
                          </p>
                        </div>
                      </div>

                      {/* Hinweis */}
                      <div className="pt-3 border-t border-amber-500/10">
                        <p className="text-[10px] text-zinc-500 text-center italic">
                          💡 Du kannst GrowHub weiterhin nutzen - Posts lesen, kommentieren, etc. 
                          Nur einige Interaktionen sind temporär eingeschränkt.
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}