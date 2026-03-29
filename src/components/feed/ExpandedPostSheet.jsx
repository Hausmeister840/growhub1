import { useState, useRef, useEffect, useCallback } from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { Heart, MessageCircle, Share2, Bookmark, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { getDisplayName, getInitials } from '@/components/utils/terminology';

export default function ExpandedPostSheet({ post, user, currentUser, onClose, onLike, onBookmark, onCommentAdded, postId }) {
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const [activeSnap, setActiveSnap] = useState(0.7);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  const isLiked = post.reactions?.like?.users?.includes(currentUser?.email) || false;
  const isBookmarked = post.bookmarked_by_users?.includes(currentUser?.email) || false;
  const totalReactions = Object.values(post.reactions || {}).reduce((sum, r) => sum + (r?.count || 0), 0);

  useEffect(() => {
    base44.entities.Comment.filter({ post_id: post.id }, '-created_date', 30)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setLoadingComments(false));
  }, [post.id]);

  const handleLike = useCallback(() => {
    if (!currentUser) { toast.error('Bitte melde dich an'); return; }
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 400);
    if (navigator.vibrate) navigator.vibrate(5);
    if (onLike) onLike('like');
  }, [currentUser, onLike]);

  const handleComment = useCallback(async () => {
    if (!commentText.trim() || sending) return;
    if (!currentUser) { toast.error('Bitte melde dich an'); return; }
    setSending(true);

    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId, post_id: post.id, content: commentText.trim(),
      author_email: currentUser.email, created_date: new Date().toISOString(),
    };
    setComments(prev => [optimistic, ...prev]);
    setCommentText('');
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const res = await base44.functions.invoke('comments/createComment', {
        postId: post.id,
        content: optimistic.content,
        parentCommentId: null,
      });
      const created = res.data?.comment || optimistic;
      setComments(prev => prev.map(c => c.id === tempId ? created : c));
      if (onCommentAdded) onCommentAdded(post.id);
    } catch (error) {
      setComments(prev => prev.filter(c => c.id !== tempId));
      console.error('Comment error:', error);
      toast.error('Fehler beim Kommentieren');
    } finally { setSending(false); }
  }, [commentText, sending, currentUser, post.id, onCommentAdded]);

  const handleShare = useCallback(async () => {
    const postUrl = `${window.location.origin}/PostThread?id=${post.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: `${getDisplayName(user)}'s Beitrag`, text: post.content?.slice(0, 100), url: postUrl }); }
      catch (err) { if (err.name !== 'AbortError') toast.error('Fehler beim Teilen'); }
    } else { navigator.clipboard.writeText(postUrl); toast.success('Link kopiert!'); }
  }, [post, user]);

  const isFullscreen = activeSnap === 1;

  return (
    <DrawerPrimitive.Root
      open={true}
      onOpenChange={(open) => { if (!open) onClose(); }}
      shouldScaleBackground={false}
      snapPoints={[0.7, 1]}
      activeSnapPoint={activeSnap}
      setActiveSnapPoint={setActiveSnap}
      fadeFromIndex={1}
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm" />
        <DrawerPrimitive.Content
          className={`fixed inset-x-0 bottom-0 z-[9999] flex flex-col gh-sheet outline-none ${isFullscreen ? 'rounded-none' : 'rounded-t-3xl'}`}
          style={{ maxHeight: isFullscreen ? '100vh' : '70vh' }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing flex-shrink-0">
            <div className="w-10 h-1.5 rounded-full bg-zinc-600" />
          </div>

          {/* Scrollable content */}
          <div ref={scrollRef} className="overflow-y-auto flex-1 overscroll-contain" style={{ minHeight: 0 }}>
            {/* Post header */}
            <div className="px-4 pt-2 pb-2 flex items-center gap-3">
              <Link to={`/Profile?id=${user?.id || user?.email || 'unknown'}`} onClick={onClose} className="flex items-center gap-3 flex-1 min-w-0">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={getDisplayName(user)} className="w-11 h-11 rounded-full object-cover ring-2 ring-green-500/30" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {getInitials(user)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <DrawerPrimitive.Title className="font-bold text-white truncate text-[15px]">{getDisplayName(user)}</DrawerPrimitive.Title>
                <DrawerPrimitive.Description className="sr-only">Beitrag von {getDisplayName(user)}</DrawerPrimitive.Description>
                  <p className="text-xs text-zinc-500">{formatDistanceToNow(new Date(post.created_date), { addSuffix: true, locale: de })}</p>
                </div>
              </Link>
            </div>

            {/* Content */}
            {post.content && (
              <div className="px-4 pb-3">
                <p className="text-white leading-relaxed whitespace-pre-wrap text-[15px]">
                  {showMore || post.content.length <= 400 ? post.content : `${post.content.slice(0, 400)}...`}
                </p>
                {post.content.length > 400 && (
                  <button onClick={() => setShowMore(v => !v)} className="text-green-400 text-xs mt-1.5 font-medium">
                    {showMore ? 'Weniger' : 'Mehr anzeigen'}
                  </button>
                )}
              </div>
            )}

            {/* Media */}
            {Array.isArray(post.media_urls) && post.media_urls.length > 0 && (
              <div className="pb-3">
                {post.media_urls.length === 1 ? (
                  <img src={post.media_urls[0]} alt="Post" className="w-full max-h-[50vh] object-cover bg-zinc-900" onError={e => { e.target.style.display = 'none'; }} />
                ) : (
                  <div className="px-4 grid grid-cols-2 gap-1.5">
                    {post.media_urls.slice(0, 4).map((url, idx) => (
                      <div key={idx} className="relative">
                        <img src={url} alt={`Media ${idx + 1}`} className="w-full aspect-square object-cover rounded-xl bg-zinc-900" onError={e => { e.target.style.display = 'none'; }} />
                        {idx === 3 && post.media_urls.length > 4 && (
                          <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-lg">+{post.media_urls.length - 4}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            {post.tags?.length > 0 && (
              <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                {post.tags.slice(0, 6).map(tag => (
                  <span key={tag} className="px-2.5 py-0.5 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/20">#{tag}</span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="px-4 py-3 flex items-center justify-between border-t border-white/10">
              <div className="flex items-center gap-2">
                <button onClick={handleLike} className="gh-pressable flex items-center gap-2 px-3 py-2 rounded-xl transition-all hover:bg-white/[0.04]">
                  <Heart className={`w-5 h-5 transition-colors ${isLiked ? 'fill-red-500 text-red-500' : 'text-zinc-400'}`} />
                  {totalReactions > 0 && <span className={`text-sm font-semibold ${isLiked ? 'text-red-400' : 'text-zinc-400'}`}>{totalReactions}</span>}
                </button>
                <button onClick={() => inputRef.current?.focus()} className="gh-pressable flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-zinc-400 hover:bg-white/[0.04]">
                  <MessageCircle className="w-5 h-5" />
                  {comments.length > 0 && <span className="text-sm font-semibold">{comments.length}</span>}
                </button>
                <button onClick={handleShare} className="gh-pressable px-3 py-2 rounded-xl transition-all text-zinc-400 hover:bg-white/[0.04]">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
              <button onClick={() => { if (onBookmark) onBookmark(); }} className={`gh-pressable p-2 rounded-xl transition-all hover:bg-white/[0.04] ${isBookmarked ? 'text-yellow-400' : 'text-zinc-400'}`}>
                <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Comments section */}
            <div className="px-4 pb-4">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">
                Kommentare {comments.length > 0 && `· ${comments.length}`}
              </p>
              {loadingComments ? (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex-shrink-0" />
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="h-3 bg-zinc-800 rounded w-1/3" />
                        <div className="h-3 bg-zinc-800 rounded w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-6 text-zinc-600 text-sm">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Noch keine Kommentare. Sei der Erste!
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map(comment => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {(comment.author_email?.[0] || '?').toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="bg-zinc-900 rounded-2xl rounded-tl-sm px-3 py-2.5">
                          <p className="text-xs font-semibold text-zinc-300 mb-0.5">{comment.author_email?.split('@')[0]}</p>
                          <p className="text-sm text-white leading-relaxed">{comment.content}</p>
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-1 ml-2">
                          {formatDistanceToNow(new Date(comment.created_date), { addSuffix: true, locale: de })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Comment Input — pinned to bottom */}
          <div className="flex-shrink-0 border-t border-white/10 bg-black/20 px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
            {currentUser ? (
              <div className="flex gap-3 items-end">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {getInitials(currentUser)}
                </div>
                <div className="flex-1 flex items-end gap-2 bg-zinc-900 border border-zinc-700/50 rounded-2xl px-3 py-2 focus-within:border-green-500/50 transition-colors">
                  <textarea
                    ref={inputRef}
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment(); } }}
                    placeholder="Kommentieren..."
                    rows={1}
                    className="flex-1 bg-transparent text-white text-sm placeholder-zinc-500 resize-none focus:outline-none max-h-28 leading-relaxed"
                    style={{ minHeight: '22px' }}
                    onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 112) + 'px'; }}
                  />
                  <button
                    onClick={handleComment}
                    disabled={!commentText.trim() || sending}
                    className={`p-1.5 rounded-xl transition-all flex-shrink-0 ${commentText.trim() ? 'text-green-400 hover:text-green-300' : 'text-zinc-600'}`}
                  >
                    {sending ? <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-center text-sm text-zinc-500">
                <Link to="/Feed" onClick={onClose} className="text-green-400 font-medium">Anmelden</Link> um zu kommentieren
              </p>
            )}
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}