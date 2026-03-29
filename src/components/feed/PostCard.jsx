import { useState, useMemo, useCallback, memo, useRef } from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Bookmark } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { isVideoUrl } from '../utils/media';
import PostMenu from "./PostMenu";
import PostContent from "./PostContent";
import ShareButton from "./ShareButton";
import { getUserInitials, getUserColor } from '../utils/dataUtils';
import LiveBadge from "./LiveBadge";
import { toast } from "sonner";

const MediaGrid = memo(({ urls, onMediaClick, post, priority = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const safeUrls = useMemo(() => {
    if (!Array.isArray(urls)) return [];
    return urls.filter(url => {
      if (!url || typeof url !== 'string') return false;
      const trimmed = url.trim();
      if (!trimmed) return false;
      try {
        new URL(trimmed);
        return true;
      } catch {
        return false;
      }
    });
  }, [urls]);

  const currentUrl = safeUrls[currentIndex];
  const isVideo = currentUrl && isVideoUrl(currentUrl);
  const totalMedia = safeUrls.length;

  if (totalMedia === 0) return null;

  // Determine aspect ratio based on media count for visual variety
  const aspectClass = totalMedia === 1 ? 'aspect-[4/5]' : 'aspect-square';

  return (
    <div
      className={`relative w-full ${aspectClass} overflow-hidden group cursor-pointer bg-zinc-950`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onMediaClick) onMediaClick(post, currentIndex);
      }}
    >
      {isVideo ? (
        <video
          src={currentUrl}
          poster={post.thumbnail_url}
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        <img
          src={currentUrl}
          alt={post.content || 'Post image'}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading={priority ? 'eager' : 'lazy'}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      )}

      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Media Counter - Modern pill design */}
      {totalMedia > 1 && (
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md rounded-full px-3 py-1.5 text-white text-xs font-bold shadow-lg">
          {currentIndex + 1} / {totalMedia}
        </div>
      )}

      {/* Navigation Dots - Bottom center */}
      {totalMedia > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-2">
          {safeUrls.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`rounded-full transition-all duration-300 ${
                idx === currentIndex 
                  ? 'bg-white w-6 h-2' 
                  : 'bg-white/40 w-2 h-2 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
});

MediaGrid.displayName = 'MediaGrid';

function PostCard({
  post,
  user: postUser,
  currentUser,
  onReact,
  onBookmark,
  onDelete,
  onCommentClick,
  onEdit,
  onReport,
  onMediaClick,
  onShare,
  priority = false
}) {
  const safePost = useMemo(() => {
    if (!post || typeof post !== 'object' || !post.id) return null;
    return {
      id: post.id || '',
      content: post.content || '',
      created_by: post.created_by || '',
      created_date: post.created_date || new Date().toISOString(),
      reactions: post.reactions || {
        like: { count: 0, users: [] },
        fire: { count: 0, users: [] },
        laugh: { count: 0, users: [] },
        mind_blown: { count: 0, users: [] },
        helpful: { count: 0, users: [] },
        celebrate: { count: 0, users: [] }
      },
      comments_count: post.comments_count || 0,
      media_urls: Array.isArray(post.media_urls) ? post.media_urls : [],
      tags: Array.isArray(post.tags) ? post.tags : [],
      bookmarked_by_users: Array.isArray(post.bookmarked_by_users) ? post.bookmarked_by_users : [],
      type: post.type || 'text',
      post_type: post.post_type || 'general'
    };
  }, [post]);

  const safeUser = useMemo(() => {
    if (!postUser || !postUser.email) {
      const email = safePost?.created_by || '';
      const username = email.split('@')[0] || 'user';
      return {
        id: null,
        full_name: username.charAt(0).toUpperCase() + username.slice(1),
        username: username,
        email: email,
        avatar_url: null,
        verified: false
      };
    }
    return {
      id: postUser.id || null,
      ...postUser,
      username: postUser.username || postUser.email?.split('@')[0] || 'user'
    };
  }, [postUser, safePost]);

  const isOwnPost = useMemo(() => 
    currentUser && safePost && currentUser.email === safePost.created_by
  , [currentUser, safePost]);

  const isBookmarked = useMemo(() => 
    currentUser && safePost && safePost.bookmarked_by_users.includes(currentUser.email)
  , [currentUser, safePost]);

  const likeCount = useMemo(() => 
    safePost?.reactions?.like?.count || 0
  , [safePost]);

  const hasLiked = useMemo(() => 
    safePost?.reactions?.like?.users?.includes(currentUser?.email) || false
  , [safePost, currentUser]);

  const commentCount = safePost?.comments_count || 0;

  const isLivePost = safePost?.type === 'live' || safePost?.post_type === 'live';

  // Rate Limiting für Spam-Klick-Prävention
  const isProcessingRef = useRef({ like: false, bookmark: false });

  // Haptic Feedback helper
  const triggerHaptic = useCallback((type = 'light') => {
    if ('vibrate' in navigator) {
      navigator.vibrate(type === 'light' ? 10 : 30);
    }
  }, []);

  const handleLike = useCallback(() => {
    if (!currentUser) {
      toast.error('Bitte melde dich an');
      return;
    }
    if (isProcessingRef.current.like) return;
    isProcessingRef.current.like = true;
    
    triggerHaptic('light');
    
    // Visual feedback
    if (!hasLiked) {
      toast.success('👍', { duration: 800, position: 'bottom-center' });
    }
    
    if (onReact && safePost) onReact(safePost.id, 'like');
    
    setTimeout(() => {
      isProcessingRef.current.like = false;
    }, 400);
  }, [safePost, onReact, triggerHaptic, currentUser, hasLiked]);

  const handleBookmark = useCallback(() => {
    if (!currentUser) {
      toast.error('Bitte melde dich an');
      return;
    }
    if (isProcessingRef.current.bookmark) return;
    isProcessingRef.current.bookmark = true;
    
    triggerHaptic('light');
    
    // Visual feedback
    toast.success(isBookmarked ? '🔖 Entfernt' : '🔖 Gespeichert', { 
      duration: 1000, 
      position: 'bottom-center' 
    });
    
    if (onBookmark && safePost) onBookmark(safePost.id);
    
    setTimeout(() => {
      isProcessingRef.current.bookmark = false;
    }, 400);
  }, [safePost, onBookmark, triggerHaptic, currentUser, isBookmarked]);

  const handleComment = useCallback(() => {
    if (onCommentClick && safePost) onCommentClick(safePost);
  }, [safePost, onCommentClick]);

  const handleShare = useCallback(() => {
    if (onShare && safePost) onShare(safePost);
  }, [safePost, onShare]);

  if (!safePost) return null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="bg-zinc-950 overflow-hidden"
    >
      {/* Header - Compact & Clean */}
      <div className="px-4 py-3 flex items-center justify-between">
        <Link
          to={createPageUrl(`Profile?id=${safeUser.id || safeUser.email}`)}
          className="flex items-center gap-3 group flex-1 min-w-0"
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ring-2 ring-zinc-800 ring-offset-2 ring-offset-zinc-950"
            style={{ background: `linear-gradient(135deg, ${getUserColor(safeUser.email)}, ${getUserColor(safeUser.email)}dd)` }}
          >
            {safeUser.avatar_url ? (
              <img src={safeUser.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              getUserInitials(safeUser.full_name, safeUser.email)
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white group-hover:text-green-400 transition-colors truncate">
                {safeUser.full_name}
              </h3>
              {isLivePost && <LiveBadge />}
            </div>
            <time className="text-xs text-zinc-500">
              {formatDistanceToNow(new Date(safePost.created_date), { addSuffix: true, locale: de })}
            </time>
          </div>
        </Link>

        <PostMenu
          post={safePost}
          isOwnPost={isOwnPost}
          onEdit={onEdit}
          onDelete={onDelete}
          onReport={onReport}
        />
      </div>

      {/* Media FIRST - Big & Immersive */}
      {safePost.media_urls.length > 0 && (
        <MediaGrid
          urls={safePost.media_urls}
          onMediaClick={(post, idx) => onMediaClick && onMediaClick(post, idx)}
          post={safePost}
          priority={priority}
        />
      )}

      {/* Content - Below media for visual flow */}
      {safePost.content && (
        <div className="px-4 pt-4">
          <PostContent content={safePost.content} />
        </div>
      )}

      {/* Tags */}
      {safePost.tags.length > 0 && (
        <div className="px-4 pt-3 flex flex-wrap gap-2">
          {safePost.tags.map((tag, idx) => (
            <Link
              key={idx}
              to={createPageUrl(`Feed?tag=${tag}`)}
              className="text-green-400 text-sm hover:text-green-300 cursor-pointer font-medium bg-green-500/10 px-3 py-1 rounded-full transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* Actions - Modern floating style */}
      <div className="px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
              hasLiked 
                ? 'bg-red-500/15 text-red-500' 
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
            {likeCount > 0 && <span className="text-sm font-bold">{likeCount}</span>}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleComment}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all"
          >
            <MessageCircle className="w-5 h-5" />
            {commentCount > 0 && <span className="text-sm font-bold">{commentCount}</span>}
          </motion.button>

          <ShareButton post={safePost} iconOnly={true} />
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleBookmark}
          className={`p-2 rounded-full transition-all ${
            isBookmarked 
              ? 'bg-green-500/15 text-green-400' 
              : 'text-zinc-500 hover:bg-zinc-900 hover:text-white'
          }`}
        >
          <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
        </motion.button>
      </div>

      {/* Divider */}
      <div className="h-2 bg-black" />
    </motion.article>
  );
}

export default memo(PostCard);