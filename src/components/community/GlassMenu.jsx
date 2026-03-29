import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Zap, Calendar, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const ACTIONS = [
  { id: 'space', label: 'Space erstellen', icon: Plus, color: 'from-green-500 to-emerald-600' },
  { id: 'post', label: 'Grow posten', icon: Zap, color: 'from-purple-500 to-pink-600' },
  { id: 'event', label: 'Event planen', icon: Calendar, color: 'from-blue-500 to-cyan-600' },
  { id: 'invite', label: 'Invite senden', icon: Send, color: 'from-orange-500 to-red-600' },
];

export default function GlassMenu({ isOpen, onClose, onCreateSpace }) {
  const handleAction = (actionId) => {
    onClose();
    
    switch (actionId) {
      case 'space':
        onCreateSpace();
        break;
      case 'post':
        window.dispatchEvent(new Event('openCreatePost'));
        break;
      case 'event':
        toast.info('Event-Feature kommt bald!');
        break;
      case 'invite':
        toast.info('Invite-Feature kommt bald!');
        break;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-sm"
          />

          {/* Menu */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="fixed bottom-0 left-0 right-0 z-[251] pb-safe"
          >
            <div className="bg-gradient-to-br from-white/[0.12] via-white/[0.08] to-white/[0.04] backdrop-blur-3xl border-t border-white/[0.15] rounded-t-3xl shadow-2xl">
              {/* Drag Handle */}
              <div className="flex justify-center py-3">
                <div className="w-10 h-1 rounded-full bg-white/30" />
              </div>

              {/* Title */}
              <div className="px-6 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-5 h-5 text-green-400" />
                  <h3 className="text-white font-bold text-lg">Quick Actions</h3>
                </div>
                <p className="text-zinc-400 text-xs">Was möchtest du tun?</p>
              </div>

              {/* Actions */}
              <div className="px-6 pb-8 space-y-2">
                {ACTIONS.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <motion.button
                      key={action.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleAction(action.id)}
                      className="w-full flex items-center gap-4 p-4 bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.10] rounded-2xl transition-all active:scale-[0.98]"
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-white font-semibold">{action.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}