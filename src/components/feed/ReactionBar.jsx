import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, Flame, Laugh, Zap, ThumbsUp, PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';

const REACTIONS = [
  { type: 'like', icon: Heart, color: 'text-red-500', label: 'Like' },
  { type: 'fire', icon: Flame, color: 'text-orange-500', label: 'Fire' },
  { type: 'laugh', icon: Laugh, color: 'text-yellow-500', label: 'Haha' },
  { type: 'mind_blown', icon: Zap, color: 'text-purple-500', label: 'Wow' },
  { type: 'helpful', icon: ThumbsUp, color: 'text-blue-500', label: 'Hilfreich' },
  { type: 'celebrate', icon: PartyPopper, color: 'text-pink-500', label: 'Feiern' }
];

export default function ReactionBar({ post, currentUser, onReact, onComment, onShare, onBookmark, isBookmarked }) {
  const [showReactions, setShowReactions] = useState(false);
  const [animatingReaction, setAnimatingReaction] = useState(null);

  const getTotalReactions = () => {
    return Object.values(post.reactions || {}).reduce((sum, r) => sum + (r.count || 0), 0);
  };

  const getUserReaction = () => {
    if (!currentUser?.email) return null;
    for (const [type, data] of Object.entries(post.reactions || {})) {
      if (data.users?.includes(currentUser.email)) {
        return type;
      }
    }
    return null;
  };

  const handleReaction = useCallback((type) => {
    if (!currentUser) return;
    
    setAnimatingReaction(type);
    setTimeout(() => setAnimatingReaction(null), 600);
    
    onReact(type);
    setShowReactions(false);
  }, [currentUser, onReact]);

  const handleLongPress = useCallback(() => {
    setShowReactions(true);
  }, []);

  const userReaction = getUserReaction();
  const totalReactions = getTotalReactions();
  const userReactionData = REACTIONS.find(r => r.type === userReaction);
  const ReactionIcon = userReactionData?.icon || Heart;

  return (
    <div className="relative">
      {/* Reaction Picker */}
      <AnimatePresence>
        {showReactions && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setShowReactions(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="absolute bottom-full left-0 mb-2 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-2 flex gap-1 z-50"
            >
              {REACTIONS.map((reaction, idx) => {
                const Icon = reaction.icon;
                return (
                  <motion.button
                    key={reaction.type}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ scale: 1.2, y: -5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleReaction(reaction.type)}
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center transition-all',
                      'hover:bg-zinc-800',
                      reaction.color
                    )}
                    title={reaction.label}
                  >
                    <Icon className="w-6 h-6" />
                  </motion.button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Animating Reaction */}
      <AnimatePresence>
        {animatingReaction && (
          <motion.div
            initial={{ scale: 0, opacity: 1, y: 0 }}
            animate={{ scale: 1.5, opacity: 0, y: -50 }}
            exit={{ opacity: 0 }}
            className="absolute left-4 top-0 pointer-events-none z-50"
          >
            {(() => {
              const reaction = REACTIONS.find(r => r.type === animatingReaction);
              const Icon = reaction?.icon || Heart;
              return <Icon className={cn('w-8 h-8', reaction?.color)} />;
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {/* React Button */}
          <motion.button
            onTouchStart={handleLongPress}
            onClick={() => userReaction ? handleReaction(userReaction) : setShowReactions(true)}
            whileTap={{ scale: 0.9 }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full transition-all group',
              userReaction
                ? 'bg-zinc-800 text-white'
                : 'hover:bg-zinc-900/50 text-zinc-400 hover:text-white'
            )}
          >
            <ReactionIcon className={cn(
              'w-5 h-5 transition-transform group-hover:scale-110',
              userReaction && userReactionData?.color
            )} />
            {totalReactions > 0 && (
              <span className="text-sm font-medium">{totalReactions}</span>
            )}
          </motion.button>

          {/* Comment Button */}
          <motion.button
            onClick={onComment}
            whileTap={{ scale: 0.9 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-zinc-900/50 transition-all text-zinc-400 hover:text-white group"
          >
            <MessageCircle className="w-5 h-5 transition-transform group-hover:scale-110" />
            {post.comments_count > 0 && (
              <span className="text-sm font-medium">{post.comments_count}</span>
            )}
          </motion.button>

          {/* Share Button */}
          <motion.button
            onClick={onShare}
            whileTap={{ scale: 0.9 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-zinc-900/50 transition-all text-zinc-400 hover:text-white group"
          >
            <Share2 className="w-5 h-5 transition-transform group-hover:scale-110" />
          </motion.button>
        </div>

        {/* Bookmark Button */}
        <motion.button
          onClick={onBookmark}
          whileTap={{ scale: 0.9 }}
          className={cn(
            'p-2 rounded-full transition-all group',
            isBookmarked
              ? 'text-green-500'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
          )}
        >
          <Bookmark className={cn(
            'w-5 h-5 transition-transform group-hover:scale-110',
            isBookmarked && 'fill-current'
          )} />
        </motion.button>
      </div>
    </div>
  );
}