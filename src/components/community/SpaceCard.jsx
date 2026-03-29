import { motion } from 'framer-motion';
import { Users, MapPin, Clock, ChevronRight, Flame } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

const CATEGORY_COLORS = {
  grow: 'from-green-500 to-emerald-600',
  strains: 'from-purple-500 to-pink-600',
  equipment: 'from-blue-500 to-cyan-600',
  region: 'from-orange-500 to-red-600',
  clubs: 'from-yellow-500 to-amber-600',
  live_talk: 'from-pink-500 to-rose-600',
};

export default function SpaceCard({ space, user, onJoin, onClick }) {
  const isMember = space.members?.includes(user?.email);
  const colorClass = CATEGORY_COLORS[space.category] || 'from-zinc-500 to-zinc-600';

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all cursor-pointer"
    >
      {/* Cover */}
      <div className={`h-20 bg-gradient-to-br ${colorClass} relative`}>
        {space.cover_image && (
          <img src={space.cover_image} alt="" className="w-full h-full object-cover" />
        )}
        {space.is_trending && (
          <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-full flex items-center gap-1">
            <Flame className="w-3 h-3 text-orange-400" />
            <span className="text-xs text-orange-400 font-bold">Trending</span>
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold truncate">{space.name}</h3>
            {space.description && (
              <p className="text-zinc-500 text-xs line-clamp-2 mt-1">{space.description}</p>
            )}
          </div>
          <ChevronRight className="w-5 h-5 text-zinc-600 flex-shrink-0 ml-2" />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-zinc-500 mb-3">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{space.member_count || 0}</span>
          </div>
          {space.geo_enabled && space.location?.city && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{space.location.city}</span>
            </div>
          )}
          {space.last_activity && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatDistanceToNow(new Date(space.last_activity), { addSuffix: true, locale: de })}</span>
            </div>
          )}
        </div>

        {/* Join Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onJoin(space.id);
          }}
          className={`w-full py-2 rounded-xl font-semibold text-sm transition-all ${
            isMember
              ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              : 'bg-green-500 text-black hover:bg-green-600'
          }`}
        >
          {isMember ? 'Beigetreten' : 'Beitreten'}
        </button>
      </div>
    </motion.div>
  );
}