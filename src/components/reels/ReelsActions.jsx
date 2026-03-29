import { motion } from 'framer-motion';
import { 
  Heart, MessageCircle, Share2, Bookmark, 
  UserPlus, UserCheck, Gift, MoreVertical, Music 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ReelsActions({
  currentVideo,
  currentUser,
  user,
  isFollowing,
  totalReactions,
  onReact,
  onComment,
  onBookmark,
  onShare,
  onFollow,
  onShowReactions,
  onShowOptions,
  isPaused
}) {
  const navigate = useNavigate();
  const hasLiked = currentVideo?.reactions?.like?.users?.includes(currentUser?.email);
  const isBookmarked = currentVideo?.bookmarked_by_users?.includes(currentUser?.email);

  return (
    <div className="absolute right-3 bottom-28 flex flex-col items-center gap-3.5 z-20 pb-safe">
      <button 
        onClick={() => onReact(currentVideo?.id, 'like')}
        onContextMenu={(e) => {
          e.preventDefault();
          onShowReactions();
        }}
        className="flex flex-col items-center gap-0.5"
      >
        <motion.div
          whileTap={{ scale: 0.85 }}
          animate={hasLiked ? { scale: [1, 1.2, 1] } : {}}
          className="w-11 h-11 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center shadow-lg active:bg-black/40"
        >
          <Heart className={`w-6 h-6 ${hasLiked ? 'text-red-500 fill-red-500' : 'text-white'} drop-shadow-lg`} />
        </motion.div>
        <span className="text-white text-xs font-bold drop-shadow">
          {totalReactions > 0 ? totalReactions : ''}
        </span>
      </button>

      <button 
        onClick={onComment}
        className="flex flex-col items-center gap-0.5"
      >
        <div className="w-11 h-11 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center shadow-lg active:bg-black/40">
          <MessageCircle className="w-6 h-6 text-white drop-shadow-lg" />
        </div>
        <span className="text-white text-xs font-bold drop-shadow">
          {currentVideo?.comments_count > 0 ? currentVideo.comments_count : ''}
        </span>
      </button>

      <button 
        onClick={onBookmark}
        className="flex flex-col items-center"
      >
        <motion.div
          whileTap={{ scale: 0.85 }}
          className="w-11 h-11 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center shadow-lg active:bg-black/40"
        >
          <Bookmark className={`w-5.5 h-5.5 ${isBookmarked ? 'text-yellow-400 fill-yellow-400' : 'text-white'} drop-shadow-lg`} />
        </motion.div>
      </button>

      <button 
        onClick={onShare}
        className="flex flex-col items-center"
      >
        <div className="w-11 h-11 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center shadow-lg active:bg-black/40">
          <Share2 className="w-5.5 h-5.5 text-white drop-shadow-lg" />
        </div>
      </button>

      {isPaused && (
        <button 
          onClick={() => {}}
          className="flex flex-col items-center opacity-60"
        >
          <div className="w-11 h-11 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <Gift className="w-5.5 h-5.5 text-white drop-shadow-lg" />
          </div>
        </button>
      )}

      <button 
        onClick={onShowOptions}
        className="flex flex-col items-center"
      >
        <div className="w-11 h-11 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center shadow-lg active:bg-black/40">
          <MoreVertical className="w-5.5 h-5.5 text-white drop-shadow-lg" />
        </div>
      </button>

      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border-2 border-white/30 flex items-center justify-center overflow-hidden shadow-lg relative mt-1"
      >
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <Music className="w-4 h-4 text-white" />
        )}
        <div className="absolute w-2 h-2 bg-black rounded-full" />
      </motion.div>

      <div className="relative mt-1">
        <div
          onClick={() => navigate(createPageUrl(`Profile?id=${user.id || currentVideo?.created_by}`))}
          className="cursor-pointer"
        >
          {user.avatar_url ? (
            <img 
              src={user.avatar_url} 
              alt="" 
              className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-lg" 
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center border-2 border-white text-white font-bold text-sm shadow-lg">
              {user.full_name?.[0] || '?'}
            </div>
          )}
        </div>
        
        {currentUser && currentUser.email !== currentVideo?.created_by && (
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
              e.stopPropagation();
              onFollow();
            }}
            className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-black shadow-md"
          >
            {isFollowing ? (
              <UserCheck className="w-3 h-3 text-white" />
            ) : (
              <UserPlus className="w-3 h-3 text-white" />
            )}
          </motion.button>
        )}
      </div>
    </div>
  );
}