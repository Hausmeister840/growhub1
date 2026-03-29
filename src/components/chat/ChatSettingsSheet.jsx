import { useState } from 'react';
import { 
  Pin, PinOff, VolumeX, Volume2, Trash2, UserCircle, 
  Search 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { updateConversation as updateConvBackend } from '@/functions/chat/updateConversation';
import { toast } from 'sonner';

export default function ChatSettingsSheet({ 
  isOpen, onClose, conversation, currentUser, allUsers, 
  updateConversation, onDelete, onSearchMessages 
}) {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isOpen || !conversation) return null;

  const { type, participants, isPinned, isMuted } = conversation;
  const myPinned = isPinned?.[currentUser?.id] || false;
  const myMuted = isMuted?.[currentUser?.id] || false;

  const otherUsers = (participants || [])
    .filter(id => id !== currentUser?.id)
    .map(id => allUsers.find(u => u.id === id))
    .filter(Boolean);

  const togglePin = async () => {
    const newPinned = { ...(isPinned || {}), [currentUser.id]: !myPinned };
    updateConversation?.(conversation.id, { isPinned: newPinned });
    updateConvBackend({ conversationId: conversation.id, data: { isPinned: newPinned } }).catch(() => {});
    toast.success(myPinned ? 'Losgelöst' : 'Angepinnt');
  };

  const toggleMute = async () => {
    const newMuted = { ...(isMuted || {}), [currentUser.id]: !myMuted };
    updateConversation?.(conversation.id, { isMuted: newMuted });
    updateConvBackend({ conversationId: conversation.id, data: { isMuted: newMuted } }).catch(() => {});
    toast.success(myMuted ? 'Benachrichtigungen an' : 'Stummgeschaltet');
  };

  const handleDeleteChat = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    try {
      await base44.entities.Conversation.delete(conversation.id);
      toast.success('Chat gelöscht');
      onClose();
      if (onDelete) onDelete();
    } catch {
      toast.error('Löschen fehlgeschlagen');
    }
  };

  const actions = [
    { icon: myPinned ? PinOff : Pin, label: myPinned ? 'Losgelöst' : 'Anpinnen', onClick: togglePin },
    { icon: myMuted ? Volume2 : VolumeX, label: myMuted ? 'Ton an' : 'Stummschalten', onClick: toggleMute },
    { icon: Search, label: 'Nachrichten suchen', onClick: () => { onClose(); onSearchMessages?.(); } },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[9999] bg-zinc-950 border-t border-zinc-800 rounded-t-3xl max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1.5 rounded-full bg-zinc-700" />
            </div>

            {/* Members */}
            <div className="px-5 py-4">
              <h3 className="text-lg font-bold text-white mb-4">
                {type === 'direct' ? 'Chat-Info' : conversation.name || 'Gruppen-Info'}
              </h3>

              <div className="space-y-3 mb-6">
                {otherUsers.map(u => (
                  <button
                    key={u.id}
                    onClick={() => { onClose(); navigate(`/Profile?id=${u.id}`); }}
                    className="w-full flex items-center gap-3 p-3 bg-zinc-900/60 rounded-2xl hover:bg-zinc-800/60 transition-colors"
                  >
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="w-11 h-11 rounded-xl object-cover" />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                        <span className="text-white font-bold">{(u.full_name || u.username || '?')[0].toUpperCase()}</span>
                      </div>
                    )}
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{u.full_name || u.username || u.email?.split('@')[0]}</p>
                      {u.username && <p className="text-xs text-zinc-500">@{u.username}</p>}
                    </div>
                    <UserCircle className="w-5 h-5 text-zinc-600" />
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="space-y-1">
                {actions.map((a, i) => (
                  <button
                    key={i}
                    onClick={a.onClick}
                    className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl hover:bg-zinc-900/60 transition-colors"
                  >
                    <a.icon className="w-5 h-5 text-zinc-400" />
                    <span className="text-sm font-medium text-white">{a.label}</span>
                  </button>
                ))}

                {/* Delete */}
                <button
                  onClick={handleDeleteChat}
                  className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-5 h-5 text-red-400" />
                  <span className="text-sm font-medium text-red-400">
                    {confirmDelete ? 'Wirklich löschen?' : 'Chat löschen'}
                  </span>
                </button>
              </div>
            </div>

            <div className="h-[env(safe-area-inset-bottom)]" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}