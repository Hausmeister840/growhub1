import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getReputationLevel } from './ReputationBadge';

export default function LevelUpAnimation({ isVisible, xp, onDismiss }) {
  const rep = getReputationLevel(xp);

  useEffect(() => {
    if (isVisible) {
      const t = setTimeout(onDismiss, 4000);
      return () => clearTimeout(t);
    }
  }, [isVisible, onDismiss]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -30 }}
          transition={{ type: 'spring', damping: 15 }}
          className="fixed inset-0 z-[300] flex items-center justify-center pointer-events-none"
        >
          <div className="relative">
            {/* Glow ring */}
            <motion.div
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="absolute inset-0 rounded-full bg-green-500/30 blur-2xl"
            />

            <motion.div
              initial={{ scale: 0.3 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12 }}
              className="relative bg-zinc-900/95 backdrop-blur-xl border-2 border-green-500/50 rounded-3xl p-8 text-center shadow-2xl shadow-green-500/20"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="text-6xl mb-3"
              >
                {rep.icon}
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-black text-white mb-1"
              >
                LEVEL UP!
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-green-400 font-bold text-lg"
              >
                {rep.label}
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-zinc-500 text-sm mt-1"
              >
                {xp} XP erreicht
              </motion.p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}