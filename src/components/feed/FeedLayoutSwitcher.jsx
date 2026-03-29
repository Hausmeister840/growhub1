import { motion } from 'framer-motion';
import { Grid3x3, List, Layers } from 'lucide-react';

const layouts = [
  { id: 'cards', label: 'Karten', icon: List },
  { id: 'grid', label: 'Raster', icon: Grid3x3 },
  { id: 'immersive', label: 'Immersiv', icon: Layers }
];

export default function FeedLayoutSwitcher({ currentLayout, onLayoutChange }) {
  return (
    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-4">
      <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
        <Layers className="w-4 h-4 text-purple-400" />
        Layout
      </h3>
      
      <div className="grid grid-cols-3 gap-2">
        {layouts.map((layout) => {
          const Icon = layout.icon;
          const isActive = currentLayout === layout.id;
          
          return (
            <motion.button
              key={layout.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onLayoutChange(layout.id)}
              className={`relative p-3 rounded-2xl transition-all ${
                isActive
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <div className="flex flex-col items-center gap-1.5">
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-medium">{layout.label}</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}