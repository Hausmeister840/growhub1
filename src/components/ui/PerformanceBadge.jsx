import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Battery, Wifi } from 'lucide-react';
import useOptimization from '../hooks/useOptimization';

/**
 * ⚡ PERFORMANCE BADGE
 * Zeigt aktuellen Performance-Level
 */

export default function PerformanceBadge({ show = false }) {
  const { level, settings } = useOptimization();
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => setIsVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [level, show]);

  const levelConfig = {
    'high-performance': {
      icon: Zap,
      color: 'text-green-400',
      bg: 'bg-green-500/20',
      border: 'border-green-500/50',
      label: 'High Performance'
    },
    'balanced': {
      icon: Wifi,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/20',
      border: 'border-yellow-500/50',
      label: 'Balanced'
    },
    'battery-saver': {
      icon: Battery,
      color: 'text-orange-400',
      bg: 'bg-orange-500/20',
      border: 'border-orange-500/50',
      label: 'Battery Saver'
    }
  };

  const config = levelConfig[level] || levelConfig['balanced'];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-20 right-4 z-50 lg:bottom-4"
        >
          <div className={`${config.bg} ${config.border} border-2 rounded-full px-4 py-2 backdrop-blur-xl flex items-center gap-2`}>
            <Icon className={`w-4 h-4 ${config.color}`} />
            <span className="text-white text-sm font-medium">{config.label}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}