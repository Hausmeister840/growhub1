import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Plus, Droplets, Leaf, Bug, Calendar, X, Check } from 'lucide-react';
import { toast } from 'sonner';

const REMINDER_TYPES = [
  { id: 'water', label: 'Bewässern', icon: Droplets, color: 'blue' },
  { id: 'feed', label: 'Düngen', icon: Leaf, color: 'green' },
  { id: 'check', label: 'Schädlingskontrolle', icon: Bug, color: 'red' },
  { id: 'phase', label: 'Phasenwechsel', icon: Calendar, color: 'purple' }
];

export default function GrowReminders({ diary }) {
  const [reminders, setReminders] = useState([
    { id: 1, type: 'water', label: 'Bewässern', nextDue: '2026-01-18', interval: 2 },
    { id: 2, type: 'feed', label: 'Düngen', nextDue: '2026-01-20', interval: 7 }
  ]);
  const [showAdd, setShowAdd] = useState(false);

  const handleComplete = (reminderId) => {
    const reminder = reminders.find(r => r.id === reminderId);
    if (!reminder) return;

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + reminder.interval);

    setReminders(reminders.map(r => 
      r.id === reminderId 
        ? { ...r, nextDue: nextDate.toISOString().split('T')[0] }
        : r
    ));

    toast.success(`✅ ${reminder.label} erledigt!`);
  };

  const isOverdue = (dateStr) => {
    return new Date(dateStr) < new Date();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-3xl p-6 border border-zinc-800"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-yellow-400" />
          <h3 className="font-bold text-white">Erinnerungen</h3>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="p-2 hover:bg-zinc-800 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {reminders.map(reminder => {
            const type = REMINDER_TYPES.find(t => t.id === reminder.type);
            const Icon = type?.icon || Bell;
            const overdue = isOverdue(reminder.nextDue);

            return (
              <motion.div
                key={reminder.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`p-4 rounded-2xl border ${
                  overdue 
                    ? 'bg-red-500/10 border-red-500/30' 
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-${type?.color}-500/20 rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 text-${type?.color}-400`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">{reminder.label}</p>
                    <p className={`text-xs ${overdue ? 'text-red-400' : 'text-zinc-500'}`}>
                      {overdue ? 'Überfällig' : new Date(reminder.nextDue).toLocaleDateString('de-DE')}
                    </p>
                  </div>

                  <button
                    onClick={() => handleComplete(reminder.id)}
                    className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-xl transition-colors"
                  >
                    <Check className="w-4 h-4 text-green-400" />
                  </button>

                  <button
                    onClick={() => setReminders(reminders.filter(r => r.id !== reminder.id))}
                    className="p-2 hover:bg-zinc-800 rounded-xl transition-colors"
                  >
                    <X className="w-4 h-4 text-zinc-500" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {reminders.length === 0 && (
          <div className="text-center py-6">
            <p className="text-sm text-zinc-500">Keine Erinnerungen</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 pt-4 border-t border-zinc-800"
          >
            <p className="text-xs text-zinc-500 mb-3">Neue Erinnerung hinzufügen</p>
            <div className="grid grid-cols-2 gap-2">
              {REMINDER_TYPES.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => {
                      const newReminder = {
                        id: Date.now(),
                        type: type.id,
                        label: type.label,
                        nextDue: new Date().toISOString().split('T')[0],
                        interval: 7
                      };
                      setReminders([...reminders, newReminder]);
                      setShowAdd(false);
                      toast.success(`Erinnerung "${type.label}" hinzugefügt`);
                    }}
                    className={`p-3 bg-${type.color}-500/10 border border-${type.color}-500/30 rounded-xl hover:bg-${type.color}-500/20 transition-all flex items-center gap-2`}
                  >
                    <Icon className={`w-4 h-4 text-${type.color}-400`} />
                    <span className="text-sm text-white">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}