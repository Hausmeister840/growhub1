import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Ban, VolumeX, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function BlockMuteManager({ isOpen, onClose, currentUser, targetUser, onUpdate }) {
  const [loading, setLoading] = useState(null);

  const isBlocked = currentUser?.blocked_users?.includes(targetUser?.email);
  const isMuted = currentUser?.muted_users?.includes(targetUser?.email);

  const handleBlock = async () => {
    setLoading('block');
    const was = isBlocked;
    const list = currentUser.blocked_users || [];
    const updated = was ? list.filter(e => e !== targetUser.email) : [...list, targetUser.email];

    try {
      await base44.entities.User.update(currentUser.id, { blocked_users: updated });
      currentUser.blocked_users = updated;
      toast.success(was ? 'Entblockt' : 'Blockiert');
      onUpdate?.();
      if (!was) onClose();
    } catch {
      toast.error('Fehler');
    } finally {
      setLoading(null);
    }
  };

  const handleMute = async () => {
    setLoading('mute');
    const was = isMuted;
    const list = currentUser.muted_users || [];
    const updated = was ? list.filter(e => e !== targetUser.email) : [...list, targetUser.email];

    try {
      await base44.entities.User.update(currentUser.id, { muted_users: updated });
      currentUser.muted_users = updated;
      toast.success(was ? 'Stummschaltung aufgehoben' : 'Stummgeschaltet');
      onUpdate?.();
    } catch {
      toast.error('Fehler');
    } finally {
      setLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-t-2xl sm:rounded-2xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">
            {targetUser?.full_name || 'Nutzer'}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 rounded-full">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <button
          onClick={handleMute}
          disabled={!!loading}
          className="w-full flex items-center gap-3 p-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors text-left"
        >
          <VolumeX className="w-5 h-5 text-yellow-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              {isMuted ? 'Stummschaltung aufheben' : 'Stummschalten'}
            </p>
            <p className="text-xs text-zinc-500">Posts werden nicht mehr im Feed angezeigt</p>
          </div>
          {loading === 'mute' && <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />}
        </button>

        <button
          onClick={handleBlock}
          disabled={!!loading}
          className="w-full flex items-center gap-3 p-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors text-left"
        >
          <Ban className="w-5 h-5 text-red-500" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-400">
              {isBlocked ? 'Entblocken' : 'Blockieren'}
            </p>
            <p className="text-xs text-zinc-500">Kann dich nicht mehr kontaktieren</p>
          </div>
          {loading === 'block' && <Loader2 className="w-4 h-4 animate-spin text-red-400" />}
        </button>
      </motion.div>
    </motion.div>
  );
}