import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Flame } from 'lucide-react';
import PostCard from './PostCard';
import { PostSkeleton } from '../ui/LoadingSkeleton';
import { motion } from 'framer-motion';
import { base44 as base44Client } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';

export default function TrendingSection({ currentUser, users, onReact, onBookmark, onDelete, onCommentClick, onShare, onMediaClick, onEdit, onReport }) {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTrendingPosts = async () => {
      if (!currentUser) return;

      setIsLoading(true);
      try {
        const response = await base44Client.functions.invoke('getTrendingFeed', { limit: 20, timeWindow: 24 });
        setPosts(response?.data?.posts || []);
      } catch (error) {
        console.error('Failed to load trending feed:', error);
        // Fallback
        const fallbackPosts = await base44.entities.Post.filter({ status: 'published' }, '-created_date', 20);
        const sorted = (fallbackPosts || []).sort((a, b) => {
          const aScore = (a.reactions?.like?.count || 0) + (a.comments_count || 0) * 2;
          const bScore = (b.reactions?.like?.count || 0) + (b.comments_count || 0) * 2;
          return bScore - aScore;
        });
        setPosts(sorted);
      } finally {
        setIsLoading(false);
      }
    };

    loadTrendingPosts();
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <PostSkeleton key={i} />)}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <Flame className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
        <h3 className="text-white font-semibold mb-2">Keine Trends gefunden</h3>
        <p className="text-sm text-zinc-500">
          Sei der Erste und erstelle viralen Content!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post, idx) => {
        const postUser = users[post.created_by] || users[post.created_by_id] || {
          email: post.created_by,
          full_name: post.created_by?.split('@')[0] || 'User',
          username: post.created_by?.split('@')[0] || 'user',
          avatar_url: null,
          verified: false
        };

        const trendingRank = idx + 1;

        return (
          <div key={post.id} className="relative">
            {/* Trending Badge */}
            {idx < 3 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-4 left-4 z-10"
              >
                <Badge className={`
                  ${idx === 0 ? 'bg-yellow-500 text-black' : ''}
                  ${idx === 1 ? 'bg-zinc-300 text-black' : ''}
                  ${idx === 2 ? 'bg-orange-500 text-white' : ''}
                  font-bold flex items-center gap-1
                `}>
                  <Flame className="w-3 h-3" />
                  #{trendingRank}
                </Badge>
              </motion.div>
            )}

            <PostCard
              post={post}
              user={postUser}
              currentUser={currentUser}
              onReact={onReact}
              onBookmark={onBookmark}
              onDelete={onDelete}
              onCommentClick={onCommentClick}
              onShare={onShare}
              onMediaClick={onMediaClick}
              onEdit={onEdit}
              onReport={onReport}
              priority={idx < 3}
            />
          </div>
        );
      })}
    </div>
  );
}