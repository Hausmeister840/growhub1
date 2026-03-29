import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Palette, Zap, Sun, Moon, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const EFFECTS = [
  { id: 'greenscreen', name: 'Green Screen', icon: '🎬', color: 'from-green-500 to-emerald-600' },
  { id: 'beauty', name: 'Beauty', icon: '✨', color: 'from-pink-500 to-rose-600' },
  { id: 'vintage', name: 'Vintage', icon: '📷', color: 'from-amber-500 to-orange-600' },
  { id: 'neon', name: 'Neon', icon: '💡', color: 'from-purple-500 to-fuchsia-600' },
  { id: 'blur', name: 'Blur', icon: '🌫️', color: 'from-blue-500 to-cyan-600' },
  { id: 'glow', name: 'Glow', icon: '🌟', color: 'from-yellow-500 to-amber-600' },
];

const FILTERS = [
  { id: 'warm', name: 'Warm', icon: Sun, color: 'from-orange-400 to-red-500' },
  { id: 'cool', name: 'Cool', icon: Moon, color: 'from-blue-400 to-indigo-500' },
  { id: 'vibrant', name: 'Vibrant', icon: Zap, color: 'from-purple-400 to-pink-500' },
  { id: 'mono', name: 'Mono', icon: Palette, color: 'from-zinc-400 to-zinc-600' },
  { id: 'dreamy', name: 'Dreamy', icon: Star, color: 'from-indigo-400 to-purple-500' },
];

export default function ReelsEffects({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('effects');

  const handleSelect = (item) => {
    toast.success(`${item.name} angewendet!`);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[70] bg-black/90 flex items-end"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-zinc-900 rounded-t-3xl p-6 max-h-[80vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-xl flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            Effekte & Filter
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('effects')}
            className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'effects'
                ? 'bg-white text-black'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            Effekte
          </button>
          <button
            onClick={() => setActiveTab('filters')}
            className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'filters'
                ? 'bg-white text-black'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            Filter
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'effects' ? (
            <div className="grid grid-cols-3 gap-3">
              {EFFECTS.map((effect) => (
                <button
                  key={effect.id}
                  onClick={() => handleSelect(effect)}
                  className="flex flex-col items-center gap-2 p-4 bg-zinc-800 rounded-2xl hover:bg-zinc-700 transition-all"
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${effect.color} rounded-2xl flex items-center justify-center text-2xl`}>
                    {effect.icon}
                  </div>
                  <span className="text-white text-xs font-medium">{effect.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {FILTERS.map((filter) => {
                const Icon = filter.icon;
                return (
                  <button
                    key={filter.id}
                    onClick={() => handleSelect(filter)}
                    className="flex flex-col items-center gap-3 p-6 bg-zinc-800 rounded-2xl hover:bg-zinc-700 transition-all"
                  >
                    <div className={`w-20 h-20 bg-gradient-to-br ${filter.color} rounded-full flex items-center justify-center`}>
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    <span className="text-white text-sm font-medium">{filter.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <Button
          onClick={onClose}
          className="w-full mt-4"
          variant="outline"
        >
          Abbrechen
        </Button>
      </motion.div>
    </motion.div>
  );
}