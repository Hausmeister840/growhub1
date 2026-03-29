import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles } from 'lucide-react';
import PostCard from './PostCard';
import { PostSkeleton } from '../ui/LoadingSkeleton';
import { base44 as base44Client } from '@/api/base44Client';

export default function ForYouSection({ currentUser, users, onReact, onBookmark, onDelete, onCommentClick, onShare, onMediaClick, onEdit, onReport }) {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPersonalizedPosts = async () => {
      if (!currentUser) return;

      setIsLoading(true);
      try {
        const response = await base44Client.functions.invoke('getPersonalizedFeed', { limit: 20 });
        setPosts(response?.data?.posts || []);
      } catch (error) {
        console.error('Failed to load personalized feed:', error);
        // Fallback to regular posts
        const fallbackPosts = await base44.entities.Post.filter({ status: 'published' }, '-created_date', 20);
        setPosts(fallbackPosts || []);
      } finally {
        setIsLoading(false);
      }
    };

    loadPersonalizedPosts();
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
        <Sparkles className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
        <h3 className="text-white font-semibold mb-2">Keine personalisierten Inhalte</h3>
        <p className="text-sm text-zinc-500">
          Interagiere mit Posts, um personalisierte Empfehlungen zu erhalten!
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

        return (
          <PostCard
            key={post.id}
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
        );
      })}
    </div>
  );
}