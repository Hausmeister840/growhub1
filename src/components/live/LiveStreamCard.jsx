import { motion } from 'framer-motion';
import { Eye, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function LiveStreamCard({ stream, user }) {
  return (
    <Link to={createPageUrl(`LiveStream?id=${stream.id}`)}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 cursor-pointer group"
      >
        <div className="relative aspect-video">
          <img
            src={stream.thumbnail_url || '/placeholder-live.jpg'}
            alt={stream.title}
            className="w-full h-full object-cover"
          />
          
          {stream.status === 'live' && (
            <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 bg-red-600 rounded-full">
              <Radio className="w-3 h-3 text-white animate-pulse" />
              <span className="text-white text-xs font-bold">LIVE</span>
            </div>
          )}

          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-full">
            <Eye className="w-3 h-3 text-white" />
            <span className="text-white text-xs font-medium">{stream.viewer_count}</span>
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>

        <div className="p-4">
          <div className="flex items-start gap-3">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                {user?.full_name?.[0] || '?'}
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm line-clamp-2 group-hover:text-green-400 transition-colors">
                {stream.title}
              </h3>
              <p className="text-zinc-400 text-xs mt-1">{user?.full_name}</p>
              <p className="text-zinc-500 text-xs mt-0.5">{stream.category}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}