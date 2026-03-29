import { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Play, Volume2, VolumeX } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { isVideoUrl } from '@/components/utils/media';
import { getDisplayName, getInitials } from '@/components/utils/terminology';
import { useContextMenu } from '@/components/contextMenu/ContextMenuProvider';
import { getFeedPostMenuActions } from '@/components/contextMenu/menuConfigs';

const CommentsModal = lazy(() => import('@/components/comments/CommentsModal'));

const REACTIONS = [
  { type: 'like', emoji: '❤️' },
  { type: 'fire', emoji: '🔥' },
  { type: 'laugh', emoji: '😂' },
  { type: 'mind_blown', emoji: '🤯' },
  { type: 'helpful', emoji: '💡' },
  { type: 'celebrate', emoji: '🎉' },
];

function SnapVideo({ src, isActive }) {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.currentTime = 0;
      video.muted = true;
      setIsMuted(true);
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isActive]);

  const togglePlay = useCallback((e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => { setIsPlaying(true); setShowPlayIcon(false); }).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
      setShowPlayIcon(true);
      setTimeout(() => setShowPlayIcon(false), 800);
    }
  }, []);

  const toggleMute = useCallback((e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  return (
    <div className="absolute inset-0" onClick={togglePlay}>
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        playsInline
        loop
        preload="metadata"
      />
      {/* Pause icon flash */}
      <AnimatePresence>
        {showPlayIcon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-20 h-20 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Play className="w-10 h-10 text-white ml-1" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Mute toggle */}
      <button
        onClick={toggleMute}
        className="absolute bottom-24 right-4 p-2.5 bg-black/40 backdrop-blur-sm rounded-full z-10"
      >
        {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
      </button>
    </div>
  );
}

export default function SnapFeedCard({
  post,
  user,
  currentUser,
  isActive,
  onLike,
  onBookmark,
  onDelete,
  onCommentAdded,
  onCommentClick,
}) {
  const isLiked = post.reactions?.like?.users?.includes(currentUser?.email) || false;
  const isBookmarked = post.bookmarked_by_users?.includes(currentUser?.email) || false;
  const totalReactions = Object.values(post.reactions || {}).reduce((sum, r) => sum + (r?.count || 0), 0);
  const [likeAnim, setLikeAnim] = useState(false);
  const [doubleTapAnim, setDoubleTapAnim] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const reactionTimerRef = useRef(null);
  const lastTapRef = useRef(0);
  const { openMenu } = useContextMenu();

  const hasVideo = post.media_urls?.length > 0 && isVideoUrl(post.media_urls[0]);
  const hasImage = post.media_urls?.length > 0 && !hasVideo;
  const bgImage = hasImage ? post.media_urls[0] : null;

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!currentUser || isLiked) return;
      setDoubleTapAnim(true);
      setTimeout(() => setDoubleTapAnim(false), 800);
      if (navigator.vibrate) navigator.vibrate(10);
      if (onLike) onLike('like');
    }
    lastTapRef.current = now;
  }, [currentUser, isLiked, onLike]);

  const handleLike = useCallback(() => {
    if (!currentUser) { toast.error('Bitte melde dich an'); return; }
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 400);
    if (navigator.vibrate) navigator.vibrate(5);
    if (onLike) onLike('like');
  }, [currentUser, onLike]);

  const handleReaction = useCallback((type) => {
    if (!currentUser) return;
    setShowReactionPicker(false);
    if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
    if (navigator.vibrate) navigator.vibrate(8);
    if (onLike) onLike(type);
  }, [currentUser, onLike]);

  const handleHeartLongPress = useCallback(() => {
    if (!currentUser) return;
    if (navigator.vibrate) navigator.vibrate(20);
    setShowReactionPicker(true);
    if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
    reactionTimerRef.current = setTimeout(() => setShowReactionPicker(false), 3000);
  }, [currentUser]);

  const heartLongRef = useRef(null);
  const onHeartDown = () => { heartLongRef.current = setTimeout(handleHeartLongPress, 400); };
  const onHeartUp = () => { if (heartLongRef.current) clearTimeout(heartLongRef.current); };

  const handleBookmark = useCallback(() => {
    if (!currentUser) { toast.error('Bitte melde dich an'); return; }
    if (navigator.vibrate) navigator.vibrate(5);
    if (onBookmark) onBookmark();
  }, [currentUser, onBookmark]);

  const handleShare = useCallback(async () => {
    const postUrl = `${window.location.origin}/PostThread?id=${post.id}`;
    if (navigator.share) {
      navigator.share({ title: `${getDisplayName(user)}'s Beitrag`, url: postUrl }).catch(() => {});
    } else {
      navigator.clipboard.writeText(postUrl);
      toast.success('Link kopiert!');
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
        onSave: handleBookmark,
        onShare: handleShare,
        onCopyLink: () => { navigator.clipboard.writeText(`${window.location.origin}/PostThread?id=${post.id}`); toast.success('Link kopiert!'); },
        onDelete: () => { if (onDelete) onDelete(); },
        onReport: !isOwner ? () => toast.success('Meldung gesendet') : undefined,
      }),
    });
  }, [currentUser, post, user, openMenu, handleBookmark, handleShare, onDelete]);

  const contentTrimmed = post.content?.length > 120 && !expanded
    ? post.content.slice(0, 120) + '...'
    : post.content;

  return (
    <div
      className="relative w-full bg-black flex items-end overflow-hidden"
      style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
      onClick={handleDoubleTap}
    >
      {/* Background: Video or Image or Gradient */}
      {hasVideo && <SnapVideo src={post.media_urls[0]} isActive={isActive} />}

      {hasImage && (
        <div className="absolute inset-0">
          <img src={bgImage} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {!hasVideo && !hasImage && (
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-800" />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none" />

      {/* Double-tap heart animation */}
      <AnimatePresence>
        {doubleTapAnim && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
          >
            <Heart className="w-28 h-28 text-red-500 fill-red-500 drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right side action buttons — TikTok style */}
      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 z-20" onClick={e => e.stopPropagation()}>
        {/* Avatar */}
        <Link to={`/Profile?id=${user?.id || user?.email || ''}`} className="mb-2">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover ring-2 ring-white/30" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white/30">
              {getInitials(user)}
            </div>
          )}
        </Link>

        {/* Like */}
        <div className="relative flex flex-col items-center">
          <button
            onClick={(e) => { e.stopPropagation(); handleLike(); }}
            onPointerDown={onHeartDown}
            onPointerUp={onHeartUp}
            onPointerLeave={onHeartUp}
            className="p-2"
          >
            <motion.div animate={likeAnim ? { scale: [1, 1.5, 1] } : {}} transition={{ duration: 0.3 }}>
              <Heart className={`w-7 h-7 drop-shadow-lg ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
            </motion.div>
          </button>
          <span className="text-white text-xs font-semibold">{totalReactions || ''}</span>
          {/* Reaction picker */}
          <AnimatePresence>
            {showReactionPicker && (
              <motion.div
                initial={{ opacity: 0, x: 10, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 10, scale: 0.8 }}
                className="absolute right-full mr-2 top-0 bg-zinc-800/95 border border-zinc-700 rounded-2xl px-2 py-2 flex gap-1.5 z-50 shadow-2xl backdrop-blur-sm"
              >
                {REACTIONS.map(r => (
                  <button key={r.type} onClick={e => { e.stopPropagation(); handleReaction(r.type); }} className="text-xl hover:scale-125 active:scale-110 transition-transform">
                    {r.emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Comments */}
        <div className="flex flex-col items-center">
          <button onClick={e => { e.stopPropagation(); if (onCommentClick) onCommentClick(post); else setShowComments(true); }} className="p-2">
            <MessageCircle className="w-7 h-7 text-white drop-shadow-lg" />
          </button>
          <span className="text-white text-xs font-semibold">{post.comments_count || ''}</span>
        </div>

        {/* Share */}
        <button onClick={e => { e.stopPropagation(); handleShare(); }} className="p-2">
          <Share2 className="w-6 h-6 text-white drop-shadow-lg" />
        </button>

        {/* Bookmark */}
        <button onClick={e => { e.stopPropagation(); handleBookmark(); }} className="p-2">
          <Bookmark className={`w-6 h-6 drop-shadow-lg ${isBookmarked ? 'fill-yellow-400 text-yellow-400' : 'text-white'}`} />
        </button>

        {/* More */}
        {currentUser && (
          <button onClick={e => { e.stopPropagation(); openPostMenu(); }} className="p-2">
            <MoreHorizontal className="w-6 h-6 text-white drop-shadow-lg" />
          </button>
        )}
      </div>

      {/* Bottom content overlay */}
      <div className="relative z-10 w-full px-4 pb-6 pr-20" onClick={e => e.stopPropagation()}>
        {/* Author */}
        <Link to={`/Profile?id=${user?.id || user?.email || ''}`} className="flex items-center gap-2 mb-2">
          <span className="text-white font-bold text-[15px] drop-shadow-lg">{getDisplayName(user)}</span>
          {user?.verified && <span className="text-green-400 text-xs">✓</span>}
          <span className="text-white/50 text-xs drop-shadow">{formatDistanceToNow(new Date(post.created_date), { addSuffix: true, locale: de })}</span>
        </Link>

        {/* Text content */}
        {post.content && (
          <div className="mb-2">
            <p className="text-white/90 text-sm leading-relaxed drop-shadow-lg">
              {contentTrimmed}
            </p>
            {post.content.length > 120 && (
              <button onClick={() => setExpanded(!expanded)} className="text-white/60 text-xs font-medium mt-0.5">
                {expanded ? 'weniger' : 'mehr'}
              </button>
            )}
          </div>
        )}

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-green-400 text-xs font-medium drop-shadow">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Text-only: centered large text */}
      {!hasVideo && !hasImage && post.content && (
        <div className="absolute inset-0 flex items-center justify-center px-10 pointer-events-none">
          <p className="text-white text-xl sm:text-2xl font-bold text-center leading-relaxed drop-shadow-2xl line-clamp-6">
            {post.content.slice(0, 300)}
          </p>
        </div>
      )}

      {/* Inline comments modal */}
      {showComments && (
        <Suspense fallback={null}>
          <CommentsModal
            isOpen={showComments}
            onClose={() => setShowComments(false)}
            post={post}
            currentUser={currentUser}
            onCommentAdded={onCommentAdded}
          />
        </Suspense>
      )}
    </div>
  );
}