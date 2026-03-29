import { motion } from 'framer-motion';
import { MessageCircle, Eye, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

const TYPE_COLORS = {
  discussion: 'text-blue-400',
  grow_update: 'text-green-400',
  event: 'text-purple-400',
  marketplace: 'text-orange-400',
  guide: 'text-cyan-400',
  question: 'text-yellow-400',
};

export default function ThreadCard({ thread }) {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-700 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold line-clamp-2">{thread.title || 'Untitled'}</h3>
          {thread.content && (
            <p className="text-zinc-500 text-sm line-clamp-2 mt-1">{thread.content}</p>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-zinc-600 flex-shrink-0 ml-2" />
      </div>

      {thread.media_urls && thread.media_urls.length > 0 && (
        <div className="my-2">
          <img src={thread.media_urls[0]} alt="" className="w-full h-32 object-cover rounded-xl" />
        </div>
      )}

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3 text-zinc-500">
          <div className="flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{thread.reply_count || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>{thread.view_count || 0}</span>
          </div>
          <span className={TYPE_COLORS[thread.type] || 'text-zinc-500'}>
            {thread.type}
          </span>
        </div>
        <span className="text-zinc-600">
          {formatDistanceToNow(new Date(thread.created_date), { addSuffix: true, locale: de })}
        </span>
      </div>
    </motion.div>
  );
}