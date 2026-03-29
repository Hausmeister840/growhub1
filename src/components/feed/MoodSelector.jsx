import { motion } from 'framer-motion';
import { Zap, Coffee, Sparkles, Moon } from 'lucide-react';

const moods = [
  { id: null, label: 'Alle', icon: Sparkles, color: 'from-white to-zinc-400' },
  { id: 'energetic', label: 'Energetisch', icon: Zap, color: 'from-orange-400 to-red-500' },
  { id: 'calm', label: 'Entspannt', icon: Moon, color: 'from-blue-400 to-purple-500' },
  { id: 'curious', label: 'Neugierig', icon: Coffee, color: 'from-green-400 to-emerald-500' }
];

export default function MoodSelector({ currentMood, onMoodChange }) {
  return (
    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-4">
      <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-green-400" />
        Stimmung
      </h3>
      
      <div className="grid grid-cols-2 gap-2">
        {moods.map((mood) => {
          const Icon = mood.icon;
          const isActive = currentMood === mood.id;
          
          return (
            <motion.button
              key={mood.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onMoodChange(mood.id)}
              className={`relative overflow-hidden p-3 rounded-2xl transition-all ${
                isActive
                  ? 'bg-gradient-to-br ' + mood.color + ' text-white shadow-lg'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <div className="flex flex-col items-center gap-1.5">
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{mood.label}</span>
              </div>
              
              {isActive && (
                <motion.div
                  layoutId="activeMood"
                  className={`absolute inset-0 bg-gradient-to-br ${mood.color} -z-10`}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}