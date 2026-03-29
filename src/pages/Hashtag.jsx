import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Hash, TrendingUp, Grid, Loader2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Hashtag() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tagInfo, setTagInfo] = useState({ count: 0, views: 0 });
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const tag = params.get('tag')?.toLowerCase();

  useEffect(() => {
    if (tag) loadPosts();
  }, [tag]);

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const allPosts = await base44.entities.Post.filter({ status: 'published' }, '-created_date', 200).catch(() => []);
      const filtered = (allPosts || []).filter(p => 
        p.tags?.some(t => t.toLowerCase() === tag)
      );
      
      setPosts(filtered);
      setTagInfo({
        count: filtered.length,
        views: filtered.reduce((sum, p) => sum + (p.view_count || 0), 0)
      });
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPostMedia = (post) => {
    const url = post.media_urls?.[0];
    const isVideo = url && /\.(mp4|webm|mov)/i.test(url);
    return { url, isVideo };
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
      <div className="sticky top-14 lg:top-0 z-20 bg-black border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 flex items-center justify-center border border-green-500/30">
              <Hash className="w-10 h-10 text-green-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">#{tag}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-zinc-400">
                <span className="flex items-center gap-1">
                  <Grid className="w-4 h-4" />
                  {tagInfo.count} Beiträge
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  {tagInfo.views.toLocaleString()} Views
                </span>
              </div>
            </div>
          </div>
          
          <Button 
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={() => navigate(createPageUrl(`Feed?tag=${tag}`))}
          >
            <Hash className="w-4 h-4 mr-2" />
            Beiträge mit #{tag} anzeigen
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <Hash className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Keine Beiträge</h2>
            <p className="text-zinc-400">Sei der Erste mit #{tag}!</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {posts.map(post => {
              const { url, isVideo } = getPostMedia(post);
              
              return (
                <motion.button
                  key={post.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => navigate(createPageUrl(`PostThread?id=${post.id}`))}
                  className="aspect-square relative group overflow-hidden bg-zinc-900"
                >
                  {url ? (
                    isVideo ? (
                      <>
                        <video src={url} className="w-full h-full object-cover" muted />
                        <div className="absolute top-2 right-2">
                          <Play className="w-4 h-4 text-white drop-shadow-lg" />
                        </div>
                      </>
                    ) : (
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-2">
                      <p className="text-xs text-zinc-500 line-clamp-4">{post.content}</p>
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      ❤️ {post.reactions?.like?.count || 0}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}