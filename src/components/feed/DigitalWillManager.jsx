import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Users, Archive, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

export default function DigitalWillManager({ isOpen, onClose, currentUser }) {
  const [willSettings, setWillSettings] = useState({
    action: 'archive', // archive, delete, transfer
    beneficiary: '',
    delay_months: 6
  });

  const saveWill = async () => {
    toast.success('Digitales Testament gespeichert ✓');
    onClose();
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
            className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-3xl w-full max-w-md border border-white/10"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-bold text-white">Digitales Testament</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl">
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <p className="text-sm text-zinc-400">
                Bestimme was mit deinem Account passieren soll, wenn er {willSettings.delay_months} Monate inaktiv ist.
              </p>

              <div className="space-y-3">
                <ActionOption
                  icon={Archive}
                  label="Archivieren"
                  description="Account wird gesperrt aber nicht gelöscht"
                  selected={willSettings.action === 'archive'}
                  onClick={() => setWillSettings({ ...willSettings, action: 'archive' })}
                />
                
                <ActionOption
                  icon={Users}
                  label="Übertragen"
                  description="Account an Vertrauensperson übergeben"
                  selected={willSettings.action === 'transfer'}
                  onClick={() => setWillSettings({ ...willSettings, action: 'transfer' })}
                />
                
                <ActionOption
                  icon={Trash2}
                  label="Löschen"
                  description="Alle Daten permanent entfernen"
                  selected={willSettings.action === 'delete'}
                  onClick={() => setWillSettings({ ...willSettings, action: 'delete' })}
                />
              </div>

              {willSettings.action === 'transfer' && (
                <input
                  type="email"
                  placeholder="Email des Begünstigten"
                  value={willSettings.beneficiary}
                  onChange={(e) => setWillSettings({ ...willSettings, beneficiary: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50"
                />
              )}

              <div>
                <label className="text-sm text-zinc-400 mb-2 block">
                  Wartezeit bis Aktivierung
                </label>
                <select
                  value={willSettings.delay_months}
                  onChange={(e) => setWillSettings({ ...willSettings, delay_months: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value={3}>3 Monate</option>
                  <option value={6}>6 Monate</option>
                  <option value={12}>12 Monate</option>
                  <option value={24}>24 Monate</option>
                </select>
              </div>

              <button
                onClick={saveWill}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/30"
              >
                Testament speichern
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ActionOption({ icon: Icon, label, description, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-xl text-left transition-all ${
        selected
          ? 'bg-purple-500/20 border border-purple-500/30'
          : 'bg-white/5 hover:bg-white/10 border border-white/10'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${
          selected ? 'bg-purple-500/20' : 'bg-white/5'
        }`}>
          <Icon className={`w-4 h-4 ${
            selected ? 'text-purple-400' : 'text-zinc-400'
          }`} />
        </div>
        <div className="flex-1">
          <p className="text-white font-medium mb-1">{label}</p>
          <p className="text-xs text-zinc-500">{description}</p>
        </div>
      </div>
    </button>
  );
}