import { motion } from 'framer-motion';
import { Heart, MessageCircle, Play, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ProfilePostsGrid({ posts = [], isLoading = false }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-0.5">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="aspect-square bg-white/[0.03] animate-pulse" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 mx-auto mb-4 border-2 border-zinc-700 rounded-full flex items-center justify-center">
          <ImageIcon className="w-9 h-9 text-zinc-600" />
        </div>
        <p className="text-zinc-500 text-sm">Noch keine Beiträge</p>
      </div>
    );
  }

  const isVideo = (url) => /\.(mp4|mov|webm)($|\?)/i.test(url);

  return (
    <div className="grid grid-cols-3 gap-0.5">
      {posts.map((post, idx) => {
        const mediaUrl = post.media_urls?.[0];
        const hasVideo = mediaUrl && isVideo(mediaUrl);
        const totalReactions = Object.values(post.reactions || {}).reduce((s, r) => s + (r?.count || 0), 0);
        const commentCount = post.comments_count || 0;

        return (
          <motion.div
            key={post.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: Math.min(idx * 0.02, 0.3) }}
          >
            <Link
              to={createPageUrl(`PostThread?id=${post.id}`)}
              className="block relative aspect-square group overflow-hidden bg-[var(--gh-surface)]"
            >
              {mediaUrl ? (
                hasVideo ? (
                  <video src={mediaUrl} className="w-full h-full object-cover" muted preload="metadata" />
                ) : (
                  <img src={mediaUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center p-3 bg-[var(--gh-surface)]">
                  <p className="text-zinc-500 text-xs text-center line-clamp-4 leading-relaxed">{post.content}</p>
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex items-center gap-5 text-white text-sm font-bold">
                  <span className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4 fill-white" />{totalReactions}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 fill-white" />{commentCount}
                  </span>
                </div>
              </div>

              {/* Video badge */}
              {hasVideo && (
                <div className="absolute top-2 right-2 pointer-events-none">
                  <Play className="w-4 h-4 text-white drop-shadow-lg fill-white" />
                </div>
              )}

              {/* Multi-image badge */}
              {post.media_urls?.length > 1 && (
                <div className="absolute top-2 right-2 pointer-events-none">
                  <div className="bg-black/60 backdrop-blur-sm rounded px-1.5 py-0.5 text-[10px] text-white font-medium">
                    {post.media_urls.length}
                  </div>
                </div>
              )}
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}