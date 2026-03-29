import { useState, useMemo } from 'react';
import { Search, Check, Forward, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ForwardMessageModal({ isOpen, onClose, message, currentUser, conversations, allUsers }) {
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);

  const filtered = useMemo(() => {
    if (!conversations) return [];
    return conversations.filter(c => {
      if (!search) return true;
      const q = search.toLowerCase();
      if (c.name?.toLowerCase().includes(q)) return true;
      const other = (c.participants || []).find(id => id !== currentUser?.id);
      const user = allUsers?.find(u => u.id === other);
      return user?.full_name?.toLowerCase().includes(q) || user?.username?.toLowerCase().includes(q);
    });
  }, [conversations, search, currentUser?.id, allUsers]);

  const getConvName = (c) => {
    if (c.type !== 'direct') return c.name || 'Gruppe';
    const other = (c.participants || []).find(id => id !== currentUser?.id);
    const user = allUsers?.find(u => u.id === other);
    return user?.full_name || user?.username || 'Nutzer';
  };

  const getConvAvatar = (c) => {
    if (c.type !== 'direct') return null;
    const other = (c.participants || []).find(id => id !== currentUser?.id);
    return allUsers?.find(u => u.id === other)?.avatar_url;
  };

  const handleForward = async () => {
    if (selected.length === 0) return;
    setSending(true);
    const senderName = currentUser?.full_name || currentUser?.username || 'User';

    try {
      await Promise.all(selected.map(convId =>
        base44.entities.Message.create({
          conversationId: convId,
          senderId: currentUser.id,
          senderName,
          senderAvatar: currentUser?.avatar_url || null,
          type: message.type || 'text',
          content: message.content || '',
          status: 'sent',
          ...(message.media && { media: message.media }),
          forwardedFrom: {
            conversationId: message.conversationId,
            originalSenderId: message.senderId,
          },
        })
      ));
      toast.success(`Weitergeleitet an ${selected.length} Chat${selected.length > 1 ? 's' : ''}`);
      onClose();
    } catch {
      toast.error('Weiterleiten fehlgeschlagen');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed inset-x-0 bottom-0 z-[10000] bg-zinc-950 border-t border-zinc-800 rounded-t-3xl max-h-[75vh] flex flex-col"
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1.5 rounded-full bg-zinc-700" />
        </div>

        <div className="px-5 py-2">
          <h3 className="text-lg font-bold text-white mb-3">Weiterleiten an</h3>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Chat suchen..."
              className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 outline-none focus:border-green-500/50"
            />
          </div>
        </div>

        {/* Message preview */}
        <div className="mx-5 mb-3 p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/60">
          <p className="text-xs text-zinc-500 mb-1">Nachricht von {message?.senderName || 'Unbekannt'}</p>
          <p className="text-sm text-zinc-300 line-clamp-2">{message?.content || (message?.type === 'image' ? '📷 Foto' : '📎 Media')}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 min-h-0">
          {filtered.map(c => {
            const isSel = selected.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => setSelected(prev => isSel ? prev.filter(id => id !== c.id) : [...prev, c.id])}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${isSel ? 'bg-green-500/10' : 'hover:bg-zinc-900/60'}`}
              >
                {getConvAvatar(c) ? (
                  <img src={getConvAvatar(c)} alt="" className="w-10 h-10 rounded-xl object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{getConvName(c)[0]?.toUpperCase()}</span>
                  </div>
                )}
                <span className="flex-1 text-left text-sm font-medium text-white truncate">{getConvName(c)}</span>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isSel ? 'bg-green-500' : 'border-2 border-zinc-700'}`}>
                  {isSel && <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            onClick={handleForward}
            disabled={selected.length === 0 || sending}
            className="w-full py-3.5 bg-green-500 hover:bg-green-400 disabled:opacity-40 rounded-2xl text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Forward className="w-4 h-4" /> Weiterleiten ({selected.length})</>}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}