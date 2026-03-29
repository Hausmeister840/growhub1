import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function GlassModal({ isOpen, onClose, children, title, icon, subtitle, maxWidth = 'max-w-2xl', fullHeight = false }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/60"
          onClick={onClose}
        >
          {/* Glass backdrop blur */}
          <div className="absolute inset-0 backdrop-blur-2xl" />

          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className={`relative w-full ${maxWidth} ${fullHeight ? 'h-[95vh] sm:h-[90vh]' : 'max-h-[95vh] sm:max-h-[90vh]'} 
              bg-gradient-to-br from-white/[0.08] via-white/[0.05] to-white/[0.02]
              backdrop-blur-3xl
              border border-white/[0.12]
              rounded-t-3xl sm:rounded-3xl
              shadow-[0_8px_60px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)]
              overflow-hidden flex flex-col`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glass header */}
            {(title || icon) && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-white/[0.03]">
                <div className="flex items-center gap-3">
                  {icon && (
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500/30 to-emerald-600/20 backdrop-blur-sm flex items-center justify-center border border-green-500/20 shadow-lg shadow-green-500/10">
                      {icon}
                    </div>
                  )}
                  <div>
                    {title && <h2 className="text-lg font-bold text-white">{title}</h2>}
                    {subtitle && <p className="text-xs text-zinc-400">{subtitle}</p>}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto glass-scrollbar">
              {children}
            </div>
          </motion.div>

          <style>{`
            .glass-scrollbar::-webkit-scrollbar { width: 6px; }
            .glass-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .glass-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            .glass-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}