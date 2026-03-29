import { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Sprout, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { isVideoUrl } from '@/components/utils/media';
import { useContextMenu } from '@/components/contextMenu/ContextMenuProvider';
import { getFeedPostMenuActions } from '@/components/contextMenu/menuConfigs';
import useLongPress from '@/components/contextMenu/useLongPress';
import { getDisplayName, getInitials } from '@/components/utils/terminology';
import GrowDiaryBadge from './GrowDiaryBadge';

// Inline critical components, lazy-load only heavy overlays
import DoubleTapLike from '@/components/feed/DoubleTapLike';
const InlineFeedVideo = lazy(() => import('@/components/feed/InlineFeedVideo'));
const FullscreenMediaViewer = lazy(() => import('@/components/feed/FullscreenMediaViewer'));
const ExpandedPostSheet = lazy(() => import('@/components/feed/ExpandedPostSheet'));

const REACTIONS = [
  { type: 'like', emoji: '❤️', label: 'Like' },
  { type: 'fire', emoji: '🔥', label: 'Feuer' },
  { type: 'laugh', emoji: '😂', label: 'Lachen' },
  { type: 'mind_blown', emoji: '🤯', label: 'Wow' },
  { type: 'helpful', emoji: '💡', label: 'Hilfreich' },
  { type: 'celebrate', emoji: '🎉', label: 'Feiern' },
];

export default function FuturisticPostCard({ 
  post, 
  user, 
  currentUser, 
  onCommentClick,
  onLike,
  onBookmark,
  onDelete,
  onCommentAdded,
  index = 0,
}) {
  const isLiked = post.reactions?.like?.users?.includes(currentUser?.email) || false;
  const isBookmarked = post.bookmarked_by_users?.includes(currentUser?.email) || false;
  // Sum all reaction types for total display
  const totalReactions = Object.values(post.reactions || {}).reduce((sum, r) => sum + (r?.count || 0), 0);
  const [showMore, setShowMore] = useState(false);
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [mediaViewerIndex, setMediaViewerIndex] = useState(0);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const [bookmarkAnim, setBookmarkAnim] = useState(false);
  const [showExpanded, setShowExpanded] = useState(false);
  const reactionTimerRef = useRef(null);
  const reactionPickerRef = useRef(null);
  const { openMenu } = useContextMenu();

  const handleLike = useCallback(async () => {
    if (!currentUser) { toast.error('Bitte melde dich an'); return; }
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 400);
    if (navigator.vibrate) navigator.vibrate(5);
    if (onLike) onLike('like');
  }, [currentUser, onLike]);

  const handleDoubleTapLike = useCallback(() => {
    if (!currentUser || isLiked) return;
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 400);
    if (onLike) onLike('like');
  }, [currentUser, isLiked, onLike]);

  const handleBookmark = useCallback(async () => {
    if (!currentUser) { toast.error('Bitte melde dich an'); return; }
    if (navigator.vibrate) navigator.vibrate(5);
    setBookmarkAnim(true);
    setTimeout(() => setBookmarkAnim(false), 400);
    if (onBookmark) onBookmark();
  }, [currentUser, onBookmark]);

  const handleShare = useCallback(async () => {
    const postUrl = `${window.location.origin}/PostThread?id=${post.id}`;
    try {
      await navigator.share({ title: `${getDisplayName(user)}'s Beitrag`, text: post.content?.slice(0, 100), url: postUrl });
    } catch (err) {
      if (err.name === 'AbortError') return;
      // Only copy to clipboard if native share is not supported
      try {
        await navigator.clipboard.writeText(postUrl);
        toast.success('Link kopiert!');
      } catch {
        toast.error('Teilen fehlgeschlagen');
      }
    }
  }, [post, user]);

  const openPostMenu = useCallback(() => {
    const isOwner = currentUser?.email === post.created_by;
    openMenu({
      type: 'feed_post',
      payload: post,
      title: post.content?.slice(0, 50) || 'Post',
      subtitle: `von ${getDisplayName(user)}`,
      actions: getFeedPostMenuActions({
        isOwner,
        onSave: () => handleBookmark(),
        onShare: () => handleShare(),
        onCopyLink: () => {
          const postUrl = `${window.location.origin}/PostThread?id=${post.id}`;
          navigator.clipboard.writeText(postUrl);
          toast.success('Link kopiert!');
        },
        onEmbed: () => {
          const postUrl = `${window.location.origin}/PostThread?id=${post.id}`;
          navigator.clipboard.writeText(`<iframe src="${postUrl}" width="100%" height="500"></iframe>`);
          toast.success('Embed-Code kopiert!');
        },
        onHide: () => toast.success('Post ausgeblendet'),
        onMute: () => toast.success('Nutzer stummgeschaltet'),
        onEdit: isOwner ? () => toast.info('Bearbeiten...') : undefined,
        onDelete: () => { if (onDelete) onDelete(); },
        onReport: !isOwner ? () => toast.success('Meldung gesendet') : undefined,
        onStats: isOwner ? () => toast.info('Statistiken...') : undefined,
      }),
    });
  }, [currentUser, post, user, openMenu, handleBookmark, handleShare, onDelete]);

  const handleReaction = useCallback((reactionType) => {
    if (!currentUser) return;
    setShowReactionPicker(false);
    if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
    if (navigator.vibrate) navigator.vibrate(8);
    // Pass reaction type to parent — for now all reactions route through onLike with type
    if (onLike) onLike(reactionType);
  }, [currentUser, onLike]);

  // Close reaction picker when tapping/clicking outside (TikTok-like behavior)
  useEffect(() => {
    if (!showReactionPicker) return undefined;

    const handlePointerDownOutside = (event) => {
      const pickerEl = reactionPickerRef.current;
      if (!pickerEl) return;
      if (!pickerEl.contains(event.target)) {
        setShowReactionPicker(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDownOutside);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDownOutside);
    };
  }, [showReactionPicker]);

  // Long press heart → show reaction picker
  const handleHeartLongPress = useCallback(() => {
    if (!currentUser) return;
    if (navigator.vibrate) navigator.vibrate(20);
    setShowReactionPicker(true);
    if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
    reactionTimerRef.current = setTimeout(() => setShowReactionPicker(false), 3000);
  }, [currentUser]);

  const longPressHandlers = useLongPress(() => {
    if (navigator.vibrate) navigator.vibrate(15);
    setShowExpanded(true);
  }, { delay: 500 });
  const { wasLongPress, ...cleanLongPressHandlers } = longPressHandlers;

  const heartLongPress = useLongPress(handleHeartLongPress, { delay: 400 });
  const { wasLongPress: heartWasLongFn, ...heartLongHandlers } = heartLongPress;

  // Strip touch/mouse handlers from card so heart long-press doesn't trigger card menu
  const { onTouchStart, onTouchEnd, onMouseDown, onMouseUp, onMouseLeave, ...cardOnlyHandlers } = cleanLongPressHandlers;

  return (
    <>
    {showExpanded && (
      <Suspense fallback={null}>
        <ExpandedPostSheet
          post={post}
          user={user}
          currentUser={currentUser}
          onClose={() => setShowExpanded(false)}
          onLike={onLike}
          onBookmark={onBookmark}
          onCommentAdded={onCommentAdded}
        />
      </Suspense>
    )}
    <div
      className="gh-card overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-zinc-950/95 to-zinc-950/80 hover:border-white/[0.15] shadow-[0_12px_40px_rgba(0,0,0,0.45)] hover:shadow-[0_24px_60px_rgba(0,0,0,0.55)] transition-all duration-300"
      {...cardOnlyHandlers}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-2.5 flex items-center gap-3" onClick={e => e.stopPropagation()}>
        <Link to={`/Profile?id=${user?.id || user?.email || 'unknown'}`} className="flex items-center gap-3 flex-1 min-w-0">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={getDisplayName(user)} className="w-10 h-10 rounded-full object-cover ring-[1.5px] ring-white/[0.08]" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold flex-shrink-0 text-[13px]">
              {getInitials(user)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-[14px] truncate leading-tight">{getDisplayName(user)}</p>
            <p className="text-[12px] text-[var(--gh-text-muted)] mt-0.5">{formatDistanceToNow(new Date(post.created_date), { addSuffix: true, locale: de })}</p>
          </div>
        </Link>

        {currentUser && (
          <button onClick={openPostMenu} className="p-2 hover:bg-white/[0.06] rounded-xl transition-colors">
            <MoreHorizontal className="w-5 h-5 text-zinc-400" />
          </button>
        )}
      </div>

      {/* Grow Diary Badge */}
      {post.post_type === 'grow_diary_update' && post.grow_diary_id && (
        <GrowDiaryBadge post={post} />
      )}

      {/* Content */}
      {post.content && (
        <div className="px-5 pb-3.5">
          <p className="text-white/90 text-[14px] leading-[1.6] whitespace-pre-wrap">
            {showMore || post.content.length <= 200 ? post.content : `${post.content.slice(0, 200)}...`}
          </p>
          {post.content.length > 200 && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowMore(!showMore); }}
              className="text-green-400 text-xs mt-1 font-medium hover:text-green-300 transition-colors"
            >
              {showMore ? 'Weniger anzeigen' : 'Mehr anzeigen'}
            </button>
          )}
        </div>
      )}

      {/* Media — wrapped in DoubleTap for images */}
      {Array.isArray(post.media_urls) && post.media_urls.length > 0 && (
        <div className="relative">
          {isVideoUrl(post.media_urls[0]) ? (
            <Suspense fallback={<div className="w-full h-64 bg-zinc-800 animate-pulse" />}>
              <InlineFeedVideo
                src={post.media_urls[0]}
                onClick={() => { setMediaViewerIndex(0); setShowMediaViewer(true); }}
              />
            </Suspense>
          ) : (
            <DoubleTapLike onDoubleTap={handleDoubleTapLike}>
              <div
                className="relative cursor-pointer"
                onClick={(e) => { e.stopPropagation(); setMediaViewerIndex(0); setShowMediaViewer(true); }}
              >
                <img
                  src={post.media_urls[0]}
                  alt="Post media"
                  className="w-full max-h-[500px] object-cover bg-zinc-900"
                  loading={index < 3 ? 'eager' : 'lazy'}
                  decoding="async"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                {post.media_urls.length > 1 && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 backdrop-blur rounded-lg text-white text-xs font-medium">
                    1/{post.media_urls.length}
                  </div>
                )}
              </div>
            </DoubleTapLike>
          )}
        </div>
      )}

      {/* Fullscreen Media Viewer */}
      {showMediaViewer && (
        <Suspense fallback={null}>
          <FullscreenMediaViewer
            isOpen={showMediaViewer}
            onClose={() => setShowMediaViewer(false)}
            post={post}
            initialIndex={mediaViewerIndex}
          />
        </Suspense>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="px-5 pb-3 flex flex-wrap gap-1.5 mt-1">
          {post.tags.slice(0, 4).map(tag => (
            <span key={tag} className="px-2.5 py-1 bg-green-600/20 text-green-300 text-[12px] rounded-full font-semibold">
              #{tag}
            </span>
          ))}
          {post.tags.length > 4 && (
            <span className="px-2.5 py-1 bg-zinc-700/60 text-zinc-300 text-[12px] rounded-full font-medium">
              +{post.tags.length - 4}
            </span>
          )}
        </div>
      )}

      {/* "View full Grow" CTA for diary posts */}
      {post.post_type === 'grow_diary_update' && post.grow_diary_id && (
        <div className="px-4 pb-3" onClick={e => e.stopPropagation()}>
          <Link
          to={`/GrowDiaryDetail?id=${post.grow_diary_id}`}
          className="flex items-center gap-2 px-3 py-2.5 bg-green-600/20 hover:bg-green-600/30 border border-green-500/40 rounded-xl transition-all group"
          >
          <Sprout className="w-4 h-4 text-green-300" />
          <span className="text-sm font-semibold text-green-300 flex-1">Gesamten Grow ansehen</span>
          <ChevronRight className="w-4 h-4 text-green-300 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-2.5 flex items-center justify-between border-t border-white/[0.06] bg-black/20" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          {/* Heart with long-press reaction picker */}
          <div className="relative">
            <button
              onTouchStart={heartLongHandlers.onTouchStart}
              onTouchEnd={heartLongHandlers.onTouchEnd}
              onMouseDown={heartLongHandlers.onMouseDown}
              onMouseUp={heartLongHandlers.onMouseUp}
              onMouseLeave={heartLongHandlers.onMouseLeave}
              onClick={(e) => { e.stopPropagation(); if (!heartWasLongFn()) handleLike(); }}
              className="flex items-center gap-1.5 px-2 py-2 rounded-xl transition-all active:scale-90"
            >
              <motion.div
                animate={likeAnim ? { scale: [1, 1.4, 1] } : { scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Heart className={`w-5 h-5 transition-colors ${isLiked ? 'fill-red-500 text-red-500' : 'text-zinc-400'}`} />
              </motion.div>
              {totalReactions > 0 && (
                <span className={`text-sm font-medium ${isLiked ? 'text-red-500' : 'text-zinc-400'}`}>{totalReactions}</span>
              )}
            </button>

            {/* Reaction Picker Popup */}
            <AnimatePresence>
              {showReactionPicker && (
                <motion.div
                  ref={reactionPickerRef}
                  initial={{ opacity: 0, y: 8, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.85 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="absolute bottom-full left-0 mb-2 bg-zinc-800 border border-zinc-700 rounded-2xl px-3 py-2.5 flex gap-2 z-50 shadow-2xl"
                >
                  {REACTIONS.map((r) => (
                    <button
                      key={r.type}
                      onClick={(e) => { e.stopPropagation(); handleReaction(r.type); }}
                      className="text-xl hover:scale-125 active:scale-110 transition-transform"
                      title={r.label}
                    >
                      {r.emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onCommentClick) {
                onCommentClick(post);
              } else {
                setShowExpanded(true);
              }
            }}
            className="flex items-center gap-1.5 px-2 py-2 rounded-xl transition-all active:scale-90"
          >
            <MessageCircle className="w-5 h-5 text-zinc-400" />
            {post.comments_count > 0 && (
              <span className="text-sm font-medium text-zinc-400">{post.comments_count}</span>
            )}
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-2 py-2 rounded-xl transition-all active:scale-90 text-zinc-400"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        <motion.button
          animate={bookmarkAnim ? { scale: [1, 1.25, 1] } : { scale: 1 }}
          transition={{ duration: 0.25 }}
          onClick={handleBookmark}
          className={`p-2 rounded-xl transition-all active:scale-90 ${isBookmarked ? 'text-yellow-400' : 'text-zinc-400'}`}
        >
          <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
        </motion.button>
      </div>
    </div>
    </>
  );
}