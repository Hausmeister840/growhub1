import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { getDisplayName, getInitials } from '@/components/utils/terminology';

const REELS_COMMENTS_CACHE_TTL_MS = 30 * 1000;
const reelsCommentsCache = new Map();

export default function ReelsCommentsModal({ isOpen, onClose, post, currentUser }) {
  const [comments, setComments] = useState([]);
  const [users, setUsers] = useState({});
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (isOpen && post?.id) load();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [isOpen, post?.id]);

  const load = async () => {
    if (!post?.id) return;

    const cacheKey = post.id;
    const cached = reelsCommentsCache.get(cacheKey);
    const cacheIsFresh = cached && (Date.now() - cached.ts) < REELS_COMMENTS_CACHE_TTL_MS;

    if (cacheIsFresh) {
      setComments(cached.comments || []);
      setUsers(cached.users || {});
      setIsLoading(false);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    try {
      const data = await base44.entities.Comment.filter({ post_id: post.id }, '-created_date');
      if (abortRef.current?.signal.aborted) return;
      setComments(data || []);

      const emails = [...new Set((data || []).map(c => c.author_email).filter(Boolean))];
      let map = {};

      if (emails.length) {
        // Use batch user resolution to avoid N+1 network requests.
        const resolvedUsers = await base44.functions.invoke('profile/resolveUsers', {
          emails,
          ids: [],
        }).catch(() => null);
        map = { ...(resolvedUsers?.data?.map || {}) };
      }

      setUsers(map);
      reelsCommentsCache.set(cacheKey, {
        comments: data || [],
        users: map,
        ts: Date.now()
      });
    } catch {
      if (abortRef.current?.signal.aborted) return;
    } finally {
      if (!abortRef.current?.signal.aborted) setIsLoading(false);
    }
  };

  const submit = async () => {
    if (!text.trim() || !currentUser || isSending) return;
    setIsSending(true);
    const content = text.trim();
    const tempId = `t-${Date.now()}`;

    setComments(prev => [{
      id: tempId, content, post_id: post.id,
      author_email: currentUser.email, created_date: new Date().toISOString()
    }, ...prev]);
    setText('');

    try {
      const created = await base44.entities.Comment.create({
        content, post_id: post.id, author_email: currentUser.email
      });
      setComments(prev => prev.map(c => c.id === tempId ? created : c));
    } catch {
      setComments(prev => prev.filter(c => c.id !== tempId));
      toast.error('Fehler');
    } finally { setIsSending(false); }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />

      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-lg mx-auto h-[65vh] bg-[#0c0c0c] rounded-t-2xl flex flex-col border-t border-white/[0.06]"
      >
        {/* Handle */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="w-9 h-1 rounded-full bg-white/[0.12]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-2.5 border-b border-white/[0.06]">
          <span className="text-[15px] font-bold text-white">
            Kommentare{comments.length > 0 ? ` · ${comments.length}` : ''}
          </span>
          <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-zinc-500 text-sm">Noch keine Kommentare</p>
              <p className="text-zinc-600 text-xs mt-1">Schreib den ersten!</p>
            </div>
          ) : (
            comments.map(c => {
              const u = users[c.author_email] || { full_name: c.author_email?.split('@')[0] };
              return (
                <div key={c.id} className="flex gap-2.5">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {getInitials(u)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-white font-semibold text-[13px]">{u.username || getDisplayName(u)}</span>
                      <span className="text-zinc-600 text-[11px]">
                        {formatDistanceToNow(new Date(c.created_date), { addSuffix: true, locale: de })}
                      </span>
                    </div>
                    <p className="text-zinc-300 text-[13px] leading-relaxed mt-0.5">{c.content}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input */}
        {currentUser ? (
          <div className="px-3 py-2.5 border-t border-white/[0.06] flex gap-2 items-center pb-safe">
            <input
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="Kommentar..."
              className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-full px-4 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500/50"
            />
            <button
              onClick={submit}
              disabled={!text.trim() || isSending}
              className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center disabled:opacity-30 active:scale-90 transition-all"
            >
              {isSending ? <Loader2 className="w-4 h-4 text-black animate-spin" /> : <Send className="w-4 h-4 text-black" />}
            </button>
          </div>
        ) : (
          <div className="px-4 py-3 border-t border-white/[0.06] text-center">
            <p className="text-zinc-500 text-sm">Melde dich an, um zu kommentieren</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}