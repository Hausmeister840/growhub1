import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Heart, LayoutGrid, List, Loader2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import PostCard from '../components/feed/PostCard';
import { usePost } from '../components/hooks/usePost';
import { toast } from 'sonner';

export default function Liked() {
  const [currentUser, setCurrentUser] = useState(null);
  const [likedPosts, setLikedPosts] = useState([]);
  const [users, setUsers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const Grid = LayoutGrid;
  const navigate = useNavigate();
  const { handleReaction, handleBookmark } = usePost();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      // Filter server-side for posts liked by user
      const liked = await base44.entities.Post.filter(
        { "reactions.like.users": user.email },
        '-created_date',
        100
      );

      setLikedPosts(liked || []);

      // Only fetch users that authored liked posts
      const creatorEmails = [...new Set((liked || []).map(p => p.created_by).filter(Boolean))];
      if (creatorEmails.length > 0) {
        const userResults = await Promise.all(
          creatorEmails.map(email => base44.entities.User.filter({ email }).catch(() => []))
        );
        const userMap = {};
        userResults.flat().forEach(u => {
          if (u?.email) {
            userMap[u.email] = {
              id: u.id,
              email: u.email,
              full_name: u.full_name,
              username: u.username,
              avatar_url: u.avatar_url
            };
          }
        });
        setUsers(userMap);
      }
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Bitte melde dich an');
      navigate(createPageUrl('Feed'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <div className="sticky top-14 lg:top-0 z-20 bg-black/95 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
                <Heart className="w-6 h-6 text-white fill-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Gefällt mir</h1>
                <p className="text-sm text-zinc-400">{likedPosts.length} Beiträge</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-green-600' : ''}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-green-600' : ''}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {likedPosts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-zinc-900 rounded-full flex items-center justify-center">
              <Heart className="w-12 h-12 text-zinc-600" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Noch keine Likes</h2>
            <p className="text-zinc-400 mb-6">Like Beiträge, um sie hier zu finden</p>
            <Button onClick={() => navigate(createPageUrl('Feed'))} className="bg-green-600 hover:bg-green-700">
              Feed erkunden
            </Button>
          </motion.div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-3 gap-1">
            {likedPosts.map(post => {
              const mediaUrl = post.media_urls?.[0];
              const isVideo = /\.(mp4|webm|mov)/i.test(mediaUrl || '');
              
              return (
                <motion.button
                  key={post.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => navigate(createPageUrl(`PostThread?id=${post.id}`))}
                  className="aspect-square relative group overflow-hidden bg-zinc-900"
                >
                  {mediaUrl ? (
                    isVideo ? (
                      <>
                        <video src={mediaUrl} className="w-full h-full object-cover" muted />
                        <Play className="absolute top-2 right-2 w-4 h-4 text-white" />
                      </>
                    ) : (
                      <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-3">
                      <p className="text-xs text-zinc-400 line-clamp-4">{post.content}</p>
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {likedPosts.map(post => {
              const postUser = users[post.created_by] || {
                id: null,
                email: post.created_by,
                full_name: post.created_by?.split('@')[0],
                username: post.created_by?.split('@')[0],
                avatar_url: null
              };

              return (
                <PostCard
                  key={post.id}
                  post={post}
                  user={postUser}
                  currentUser={currentUser}
                  onReact={(id, type) => handleReaction(id, type, currentUser, () => {})}
                  onBookmark={(id) => handleBookmark(id, currentUser, () => {})}
                  onDelete={() => {}}
                  onCommentClick={() => {}}
                  onShare={() => {}}
                  onMediaClick={() => {}}
                  onEdit={() => {}}
                  onReport={() => {}}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}