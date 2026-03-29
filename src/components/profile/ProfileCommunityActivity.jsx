import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import PostCard from '../feed/PostCard';
import { PostSkeleton } from '@/components/ui/Skeleton';

/**
 * 💬 PROFILE COMMUNITY ACTIVITY - Recent Posts
 */

export default function ProfileCommunityActivity({
  posts = [],
  isLoading,
  user,
  currentUser,
  onReact,
  onBookmark,
  onDelete
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-green-400" />
          Community Aktivität
        </h2>
        <div className="glass-card rounded-3xl overflow-hidden border border-zinc-800/50">
          {[...Array(3)].map((_, i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-8 border border-zinc-800/50 text-center"
      >
        <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-8 h-8 text-zinc-600" />
        </div>
        <p className="text-zinc-400">Noch keine Posts</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-green-400" />
          Community Aktivität
        </h2>
      </div>

      <div className="glass-card rounded-3xl overflow-hidden border border-zinc-800/50">
        {posts.map((post, index) => (
          <div key={post.id} className={index > 0 ? 'border-t border-zinc-800/30' : ''}>
            <PostCard
              post={post}
              user={user}
              currentUser={currentUser}
              onReact={onReact}
              onBookmark={onBookmark}
              onDelete={onDelete}
              onCommentClick={() => {}}
              onEdit={() => {}}
              onVote={() => {}}
              onMediaClick={() => {}}
              onShare={() => {}}
            />
          </div>
        ))}
      </div>
    </div>
  );
}