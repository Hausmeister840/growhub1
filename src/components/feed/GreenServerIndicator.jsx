import { motion } from 'framer-motion';
import { Leaf, Zap, Wind } from 'lucide-react';

export default function GreenServerIndicator() {
  const energySource = 'solar'; // solar, wind, hydro
  const carbonOffset = 250; // kg CO2 saved

  const icons = {
    solar: Zap,
    wind: Wind,
    hydro: Leaf
  };

  const Icon = icons[energySource] || Leaf;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl"
    >
      <motion.div
        animate={{ rotate: energySource === 'solar' ? [0, 360] : 0 }}
        transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
      >
        <Icon className="w-3.5 h-3.5 text-green-400" />
      </motion.div>
      
      <span className="text-xs text-green-400 font-medium">
        100% Grüne Energie
      </span>
      
      <div className="ml-auto text-[10px] text-green-600">
        -{carbonOffset}kg CO₂
      </div>
    </motion.div>
  );
}