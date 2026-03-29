import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sprout, MessageSquare, HelpCircle, Radio, ShoppingBag, Scan, ChevronRight, Sparkles } from 'lucide-react';

const ACTIONS = [
  { id: 'grow_update', emoji: '📷', label: 'Grow-Update', desc: 'Eintrag ins Tagebuch', color: 'text-green-300', priority: true, category: 'grow', tag: 'Schnell' },
  { id: 'plant_scan', icon: Scan, label: 'Pflanze scannen', desc: 'KI-Diagnose starten', color: 'text-cyan-300', featured: true, category: 'grow', tag: 'KI' },
  { id: 'new_grow', icon: Sprout, label: 'Neuen Grow starten', desc: 'Tagebuch anlegen', color: 'text-emerald-300', category: 'grow' },
  { id: 'post', icon: MessageSquare, label: 'Beitrag posten', desc: 'Allgemeiner Post', color: 'text-blue-300', category: 'community' },
  { id: 'question', icon: HelpCircle, label: 'Frage stellen', desc: 'Community fragen', color: 'text-violet-300', category: 'community' },
  { id: 'reel', icon: Radio, label: 'Story / Reel', desc: 'Video hochladen', color: 'text-pink-300', category: 'community', tag: 'Video' },
  { id: 'product', icon: ShoppingBag, label: 'Produkt einstellen', desc: 'Marktplatz', color: 'text-amber-300', category: 'community' },
];

export default function CreateActionSheet({ isOpen, onClose, hasActiveGrows, onSelectAction }) {
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  const handleAction = (actionId) => {
    onClose();
    switch (actionId) {
      case 'grow_update':
        onSelectAction('grow_update');
        break;
      case 'plant_scan':
        navigate('/PlantScan');
        break;
      case 'new_grow':
        navigate('/CreateGrowDiary');
        break;
      case 'post':
        window.dispatchEvent(new Event('openCreatePost'));
        break;
      case 'question':
        window.dispatchEvent(new Event('openCreatePost'));
        break;
      case 'reel':
        navigate('/CreateStory');
        break;
      case 'product':
        navigate('/CreateProduct');
        break;
    }
  };

  // Sort: grow_update first if user has active grows
  const sortedActions = hasActiveGrows
    ? ACTIONS
    : ACTIONS.filter(a => a.id !== 'grow_update');
  const primaryAction = sortedActions.find((action) => action.featured) ?? sortedActions[0];
  const regularActions = sortedActions.filter((action) => action.id !== primaryAction?.id);
  const growActions = regularActions.filter((action) => action.category === 'grow');
  const communityActions = regularActions.filter((action) => action.category === 'community');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%', opacity: 0.8 }}
            animate={{ y: 0 }}
            exit={{ y: '100%', opacity: 0.8 }}
            transition={{ type: 'spring', damping: 32, stiffness: 320, mass: 0.9 }}
            className="absolute bottom-0 left-0 right-0 max-h-[92vh] overflow-y-auto gh-sheet rounded-t-[30px] pb-safe"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-gradient-to-b from-[#1f2127] to-transparent pt-3 pb-2">
              <div className="flex justify-center">
                <div className="w-11 h-1.5 bg-white/[0.18] rounded-full" />
              </div>
            </div>

            <div className="px-5 pb-3">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-[var(--gh-text-secondary)]">
                <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                Schnell erstellen
              </div>
              <h3 className="mt-3 text-xl font-bold tracking-tight text-white">Erstellen</h3>
              <p className="text-sm text-[var(--gh-text-muted)] mt-1">Wähle aus, was du als Nächstes veröffentlichen möchtest.</p>
            </div>

            {primaryAction && (
              <div className="px-4 pb-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAction(primaryAction.id)}
                  className="gh-pressable group relative w-full overflow-hidden rounded-[20px] border border-cyan-400/35 bg-gradient-to-r from-cyan-500/18 via-cyan-400/8 to-emerald-400/14 p-4 text-left transition-colors hover:border-cyan-300/50"
                >
                  <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-cyan-300/12 blur-2xl" />
                  <div className="relative flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/35 bg-cyan-400/15">
                      {primaryAction.icon ? <primaryAction.icon className={`h-5 w-5 ${primaryAction.color}`} /> : <span className="text-xl">{primaryAction.emoji}</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white">{primaryAction.label}</p>
                        {primaryAction.tag && (
                          <span className="rounded-full bg-cyan-300/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-200">
                            {primaryAction.tag}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-cyan-50/75">{primaryAction.desc}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-cyan-100/70 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </motion.button>
              </div>
            )}

            <div className="px-4 pb-6 space-y-4">
              {growActions.length > 0 && (
                <div>
                  <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--gh-text-muted)]">Grow</p>
                  <div className="space-y-2">
                    {growActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <motion.button
                          key={action.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleAction(action.id)}
                          className="gh-pressable group w-full flex items-center gap-3 p-3.5 rounded-[16px] bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors"
                        >
                          <div className={`w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.07] flex items-center justify-center text-xl flex-shrink-0`}>
                            {action.emoji || (Icon && <Icon className={`w-4.5 h-4.5 ${action.color}`} />)}
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <p className={`font-semibold text-sm ${action.priority ? 'text-green-300' : 'text-white'}`}>{action.label}</p>
                            <p className="text-xs text-[var(--gh-text-muted)] mt-0.5">{action.desc}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-white/30 transition-transform group-hover:translate-x-0.5" />
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {communityActions.length > 0 && (
                <div>
                  <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--gh-text-muted)]">Community & Content</p>
                  <div className="space-y-2">
                    {communityActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <motion.button
                          key={action.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleAction(action.id)}
                          className="gh-pressable group w-full flex items-center gap-3 p-3.5 rounded-[16px] bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors"
                        >
                          <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.07] flex items-center justify-center text-xl flex-shrink-0">
                            {action.emoji || (Icon && <Icon className={`w-4.5 h-4.5 ${action.color}`} />)}
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm text-white">{action.label}</p>
                              {action.tag && (
                                <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--gh-text-secondary)]">
                                  {action.tag}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[var(--gh-text-muted)] mt-0.5">{action.desc}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-white/30 transition-transform group-hover:translate-x-0.5" />
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 pb-4">
              <button
                onClick={onClose}
                className="gh-pressable w-full py-3.5 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] rounded-[16px] text-sm font-medium text-[var(--gh-text-secondary)] transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}