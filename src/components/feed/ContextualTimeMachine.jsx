import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, TrendingUp, Rewind } from 'lucide-react';
import { toast } from 'sonner';

export default function ContextualTimeMachine({ onTimeChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState('now');

  const timePeriods = [
    { id: 'now', label: 'Jetzt', icon: Clock },
    { id: '1h', label: 'Vor 1h', icon: Rewind },
    { id: '24h', label: 'Gestern', icon: Calendar },
    { id: '7d', label: 'Letzte Woche', icon: TrendingUp }
  ];

  const selectTime = (period) => {
    setSelectedTime(period.id);
    onTimeChange(period.id);
    setIsOpen(false);
    toast.success(`Feed-Zeitpunkt: ${period.label}`);
  };

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl hover:border-blue-500/50 transition-all"
      >
        <Clock className="w-4 h-4 text-blue-400" />
        <span className="text-sm text-blue-400 font-medium">
          {timePeriods.find(t => t.id === selectedTime)?.label}
        </span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 right-0 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl z-20 min-w-[180px]"
          >
            {timePeriods.map((period) => {
              const Icon = period.icon;
              return (
                <button
                  key={period.id}
                  onClick={() => selectTime(period)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    selectedTime === period.id
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-zinc-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{period.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}