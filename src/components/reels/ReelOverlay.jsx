import { useState, useCallback } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Leaf, Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getDisplayName, getInitials } from '@/components/utils/terminology';

export default function ReelOverlay({
  post, author, currentUser, isMuted,
  onLike, onBookmark, onComment, onShare, onToggleMute
}) {
  const navigate = useNavigate();
  const [likeAnim, setLikeAnim] = useState(false);

  const isGrowPost = post?.post_type === 'grow_diary_update' || post?.category === 'grow_diary';
  const likeData = post?.reactions?.like || { count: 0, users: [] };
  const hasLiked = currentUser && likeData.users?.includes(currentUser.email);
  const isBookmarked = currentUser && post?.bookmarked_by_users?.includes(currentUser.email);
  const totalReactions = Object.values(post?.reactions || {}).reduce((s, r) => s + (r?.count || 0), 0);
  const isVideo = post?.media_urls?.[0] && /\.(mp4|webm|mov)($|\?)/i.test(post.media_urls[0]);

  const handleLike = useCallback((e) => {
    e.stopPropagation();
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 400);
    if (onLike) onLike();
  }, [onLike]);

  return (
    <>
      {/* Top gradient */}
      <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-black/50 to-transparent pointer-events-none z-10" />
      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none z-10" />

      {/* Bottom content area */}
      <div className="absolute bottom-16 left-0 right-0 z-20 px-3">
        {/* Author row */}
        <div className="flex items-center gap-2.5 mb-2">
          <button
            onClick={(e) => { e.stopPropagation(); author?.id && navigate(`/Profile?id=${author.id}`); }}
            className="flex-shrink-0"
          >
            {author?.avatar_url ? (
              <img src={author.avatar_url} alt="" className="w-9 h-9 rounded-full border border-white/30 object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center border border-white/30 text-white font-bold text-xs">
                {getInitials(author)}
              </div>
            )}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); author?.id && navigate(`/Profile?id=${author.id}`); }}
          >
            <span className="text-white font-bold text-[14px] drop-shadow-lg">
              @{author?.username || getDisplayName(author)}
            </span>
          </button>
          {author?.verified && (
            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[8px] font-bold">✓</span>
            </div>
          )}
          {isGrowPost && (
            <div className="flex items-center gap-1 ml-1">
              <Leaf className="w-3 h-3 text-green-400" />
              <span className="text-green-400 text-[11px] font-semibold">Grow</span>
            </div>
          )}
        </div>

        {/* Content text */}
        {post?.content && (
          <p className="text-white/90 text-[13px] line-clamp-2 drop-shadow-lg leading-relaxed mb-2 max-w-[85%]">
            {post.content}
          </p>
        )}

        {/* Tags */}
        {post?.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.tags.slice(0, 4).map((tag, i) => (
              <span key={i} className="text-white/50 text-xs font-medium drop-shadow">#{tag}</span>
            ))}
          </div>
        )}

        {/* Bottom action bar — horizontal */}
        <div className="flex items-center gap-1">
          {/* Like */}
          <button onClick={handleLike} className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/[0.08] active:scale-90 transition-all">
            <motion.div animate={likeAnim ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.25 }}>
              <Heart className={`w-[18px] h-[18px] ${hasLiked ? 'text-red-500 fill-red-500' : 'text-white'}`} />
            </motion.div>
            {totalReactions > 0 && <span className="text-white text-xs font-semibold">{totalReactions}</span>}
          </button>

          {/* Comment */}
          <button onClick={(e) => { e.stopPropagation(); onComment?.(); }} className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/[0.08] active:scale-90 transition-all">
            <MessageCircle className="w-[18px] h-[18px] text-white" />
            {(post?.comments_count || 0) > 0 && <span className="text-white text-xs font-semibold">{post.comments_count}</span>}
          </button>

          {/* Bookmark */}
          <button onClick={(e) => { e.stopPropagation(); onBookmark?.(); }} className="flex items-center gap-1 px-3 py-2 rounded-full bg-white/[0.08] active:scale-90 transition-all">
            <Bookmark className={`w-[18px] h-[18px] ${isBookmarked ? 'text-yellow-400 fill-yellow-400' : 'text-white'}`} />
          </button>

          {/* Share */}
          <button onClick={(e) => { e.stopPropagation(); onShare?.(); }} className="flex items-center gap-1 px-3 py-2 rounded-full bg-white/[0.08] active:scale-90 transition-all">
            <Share2 className="w-[18px] h-[18px] text-white" />
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Mute (video only) */}
          {isVideo && (
            <button onClick={(e) => { e.stopPropagation(); onToggleMute?.(); }} className="p-2 rounded-full bg-white/[0.08] active:scale-90 transition-all">
              {isMuted ? <VolumeX className="w-4 h-4 text-white/50" /> : <Volume2 className="w-4 h-4 text-white" />}
            </button>
          )}
        </div>
      </div>
    </>
  );
}