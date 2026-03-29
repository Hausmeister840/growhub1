import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Globe, Users, X } from 'lucide-react';
import { toast } from 'sonner';

export default function PrivacyControlCenter({ isOpen, onClose, currentUser }) {
  const [dataUsage, setDataUsage] = useState({
    personalization: true,
    analytics: true,
    recommendations: true,
    ai_training: false
  });

  const [visibility, setVisibility] = useState('public');

  const toggleDataUsage = (key) => {
    setDataUsage(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success('Einstellungen gespeichert');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-zinc-900 to-indigo-900/20 rounded-3xl w-full max-w-lg border border-white/10 overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-zinc-900/95 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl">
                  <Shield className="w-5 h-5 text-indigo-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Datenschutz & Kontrolle</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl">
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Data Usage Controls */}
              <div>
                <h3 className="text-white font-semibold mb-4">Datennutzung</h3>
                <div className="space-y-3">
                  <ToggleOption
                    label="Personalisierung"
                    description="Feed an deine Interessen anpassen"
                    enabled={dataUsage.personalization}
                    onToggle={() => toggleDataUsage('personalization')}
                  />
                  <ToggleOption
                    label="Analytics"
                    description="Nutzungsstatistiken erfassen"
                    enabled={dataUsage.analytics}
                    onToggle={() => toggleDataUsage('analytics')}
                  />
                  <ToggleOption
                    label="Empfehlungen"
                    description="AI-basierte Vorschläge"
                    enabled={dataUsage.recommendations}
                    onToggle={() => toggleDataUsage('recommendations')}
                  />
                  <ToggleOption
                    label="AI Training"
                    description="Daten für KI-Verbesserung nutzen"
                    enabled={dataUsage.ai_training}
                    onToggle={() => toggleDataUsage('ai_training')}
                  />
                </div>
              </div>

              {/* Visibility */}
              <div>
                <h3 className="text-white font-semibold mb-4">Standard-Sichtbarkeit</h3>
                <div className="grid grid-cols-3 gap-2">
                  <VisibilityButton
                    icon={Globe}
                    label="Öffentlich"
                    active={visibility === 'public'}
                    onClick={() => setVisibility('public')}
                  />
                  <VisibilityButton
                    icon={Users}
                    label="Freunde"
                    active={visibility === 'friends'}
                    onClick={() => setVisibility('friends')}
                  />
                  <VisibilityButton
                    icon={Lock}
                    label="Privat"
                    active={visibility === 'private'}
                    onClick={() => setVisibility('private')}
                  />
                </div>
              </div>

              {/* Data Export */}
              <div className="pt-4 border-t border-white/10">
                <button className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm font-medium transition-all">
                  Alle Daten exportieren
                </button>
                <button className="w-full mt-2 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium transition-all">
                  Account löschen
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ToggleOption({ label, description, enabled, onToggle }) {
  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
      <div className="flex-1">
        <p className="text-white text-sm font-medium">{label}</p>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`w-12 h-6 rounded-full transition-all ${
          enabled ? 'bg-green-500' : 'bg-white/10'
        }`}
      >
        <motion.div
          animate={{ x: enabled ? 24 : 0 }}
          className="w-5 h-5 bg-white rounded-full m-0.5"
        />
      </button>
    </div>
  );
}

function VisibilityButton({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-xl transition-all ${
        active
          ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg'
          : 'bg-white/5 text-zinc-400 hover:bg-white/10 border border-white/10'
      }`}
    >
      <Icon className="w-5 h-5 mx-auto mb-1" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}