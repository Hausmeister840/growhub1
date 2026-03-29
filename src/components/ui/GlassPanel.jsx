import { motion } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Reusable glass-morphism bottom panel (like Maps location detail)
 * Used for location cards, detail panels, menus etc.
 */
export default function GlassPanel({ children, onClose, title, className = '' }) {
  return (
    <motion.div
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 350 }}
      className={`fixed bottom-0 left-0 right-0 z-[1001] 
        bg-gradient-to-br from-white/[0.08] via-white/[0.05] to-white/[0.02]
        backdrop-blur-3xl
        border-t border-white/[0.12]
        rounded-t-3xl
        shadow-[0_-8px_60px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)]
        max-h-[70vh] overflow-y-auto
        md:left-4 md:right-auto md:bottom-4 md:w-96 md:rounded-3xl md:border md:border-white/[0.12]
        ${className}`}
    >
      {/* Drag handle */}
      <div className="flex justify-center py-2 md:hidden">
        <div className="w-10 h-1 rounded-full bg-white/20" />
      </div>

      {(title || onClose) && (
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
          {title && <h3 className="font-bold text-white text-lg">{title}</h3>}
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <div className="px-5 py-4">
        {children}
      </div>
    </motion.div>
  );
}