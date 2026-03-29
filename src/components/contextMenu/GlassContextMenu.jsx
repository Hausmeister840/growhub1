import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GlassContextMenu({ isOpen, onClose, actions = [], title, subtitle, onAction }) {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Close on route change
  useEffect(() => {
    const handleRoute = () => onClose();
    window.addEventListener('routeChange', handleRoute);
    return () => window.removeEventListener('routeChange', handleRoute);
  }, [onClose]);

  const normalActions = actions.filter(a => !a.danger);
  const dangerActions = actions.filter(a => a.danger);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[500] bg-black/50"
          />
          <div className="fixed inset-0 z-[500] backdrop-blur-xl pointer-events-none" />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 380, mass: 0.8 }}
            className="fixed bottom-0 left-0 right-0 z-[501] max-h-[85vh]
              bg-gradient-to-br from-white/[0.10] via-white/[0.06] to-white/[0.03]
              backdrop-blur-3xl
              border-t border-white/[0.15]
              rounded-t-[28px]
              shadow-[0_-12px_80px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.12)]
              overflow-hidden"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-9 h-[5px] rounded-full bg-white/20" />
            </div>

            {/* Title */}
            {(title || subtitle) && (
              <div className="px-6 pt-2 pb-3 border-b border-white/[0.06]">
                {title && <h3 className="text-white font-bold text-base">{title}</h3>}
                {subtitle && <p className="text-zinc-400 text-xs mt-0.5">{subtitle}</p>}
              </div>
            )}

            {/* Actions */}
            <div className="px-4 py-3 space-y-1 overflow-y-auto max-h-[60vh]">
              {normalActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => onAction(action)}
                    disabled={action.disabled}
                    className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all active:scale-[0.98]
                      ${action.disabled 
                        ? 'opacity-30 cursor-not-allowed' 
                        : 'hover:bg-white/[0.06] active:bg-white/[0.10]'
                      }`}
                  >
                    {Icon && (
                      <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                        {typeof Icon === 'string' ? (
                          <span className="text-lg">{Icon}</span>
                        ) : (
                          <Icon className="w-[18px] h-[18px] text-zinc-300" />
                        )}
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <span className="text-white text-[15px] font-medium">{action.label}</span>
                      {action.description && (
                        <p className="text-zinc-500 text-xs mt-0.5">{action.description}</p>
                      )}
                    </div>
                    {action.badge && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-semibold">
                        {action.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Danger section */}
              {dangerActions.length > 0 && (
                <>
                  <div className="my-2 border-t border-white/[0.06]" />
                  {dangerActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        onClick={() => onAction(action)}
                        disabled={action.disabled}
                        className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all active:scale-[0.98]
                          ${action.disabled 
                            ? 'opacity-30 cursor-not-allowed' 
                            : 'hover:bg-red-500/[0.08] active:bg-red-500/[0.15]'
                          }`}
                      >
                        {Icon && (
                          <div className="w-9 h-9 rounded-xl bg-red-500/[0.10] border border-red-500/[0.15] flex items-center justify-center flex-shrink-0">
                            {typeof Icon === 'string' ? (
                              <span className="text-lg">{Icon}</span>
                            ) : (
                              <Icon className="w-[18px] h-[18px] text-red-400" />
                            )}
                          </div>
                        )}
                        <span className="text-red-400 text-[15px] font-medium">{action.label}</span>
                      </button>
                    );
                  })}
                </>
              )}
            </div>

            {/* Cancel button */}
            <div className="px-4 pb-6 pt-1">
              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-zinc-300 text-[15px] font-semibold hover:bg-white/[0.10] active:scale-[0.98] transition-all"
              >
                Abbrechen
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}