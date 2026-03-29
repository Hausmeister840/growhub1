import { motion } from 'framer-motion';
import { X, Navigation, Star, ThumbsUp, MapPin } from 'lucide-react';

const SPOT_LABELS = {
  smoke_spot: '🌿 Smoke Spot',
  meetup: '🤝 Meetup-Ort',
  scenic: '🏞️ Scenic Spot',
  chill_zone: '😌 Chill Zone',
  grow_shop_tip: '🌱 Shop-Tipp',
  other: '📍 Sonstiges',
};

export default function CommunitySpotCard({ spot, currentUser, onClose, onRate, onRoute, onUpvote }) {
  const upvotes = spot.upvotes || [];
  const hasUpvoted = currentUser && upvotes.includes(currentUser.email);
  const distStr = spot.distance
    ? spot.distance < 1000 ? `${Math.round(spot.distance)}m` : `${(spot.distance / 1000).toFixed(1)}km`
    : null;

  return (
    <motion.div
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 350 }}
      className="fixed bottom-0 left-0 right-0 z-[1001] bg-gradient-to-br from-white/[0.08] via-white/[0.05] to-white/[0.02] backdrop-blur-3xl border-t border-white/[0.12] rounded-t-3xl max-h-[65vh] overflow-y-auto md:left-4 md:right-auto md:bottom-4 md:w-96 md:rounded-3xl md:border md:border-white/[0.12]"
    >
      <div className="flex justify-center py-2 md:hidden">
        <div className="w-10 h-1 rounded-full bg-white/20" />
      </div>

      <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
        <h3 className="font-bold text-white text-lg">{spot.name}</h3>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-5 py-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400">
            {SPOT_LABELS[spot.spot_type] || 'Spot'}
          </span>
          {distStr && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400">{distStr}</span>
          )}
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-400 flex items-center gap-1">
            <ThumbsUp className="w-3 h-3" /> {upvotes.length}
          </span>
        </div>

        {/* Rating */}
        {spot.avg_rating > 0 && (
          <div className="flex items-center gap-2">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className={`w-4 h-4 ${i <= Math.round(spot.avg_rating) ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-700'}`} />
            ))}
            <span className="text-sm text-zinc-400">{spot.avg_rating.toFixed(1)} ({(spot.ratings || []).length})</span>
          </div>
        )}

        {spot.description && (
          <p className="text-sm text-zinc-300">{spot.description}</p>
        )}

        {spot.address && (
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <MapPin className="w-4 h-4 text-green-400" />
            <span>{spot.address}{spot.city ? `, ${spot.city}` : ''}</span>
          </div>
        )}

        {/* Reviews preview */}
        {spot.ratings?.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-white/[0.06]">
            <p className="text-xs font-semibold text-zinc-400">Bewertungen</p>
            {spot.ratings.slice(-3).reverse().map((r, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex gap-0.5 flex-shrink-0 mt-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-2.5 h-2.5 ${s <= r.score ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-700'}`} />
                  ))}
                </div>
                {r.comment && <p className="text-xs text-zinc-400">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onUpvote}
            className={`flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              hasUpvoted ? 'bg-purple-500/30 text-purple-300 border border-purple-500/30' : 'bg-white/[0.06] text-zinc-300 border border-white/[0.08] hover:border-purple-500/30'
            }`}
          >
            <ThumbsUp className="w-4 h-4" /> {hasUpvoted ? 'Upvoted' : 'Upvote'}
          </button>
          <button
            onClick={onRate}
            className="flex-1 py-3 rounded-2xl bg-yellow-500/20 text-yellow-400 font-bold text-sm flex items-center justify-center gap-2 border border-yellow-500/20 hover:border-yellow-500/40 transition-all"
          >
            <Star className="w-4 h-4" /> Bewerten
          </button>
        </div>

        <button
          onClick={onRoute}
          className="w-full py-3 bg-gradient-to-r from-green-500/80 to-emerald-600/80 hover:from-green-500 hover:to-emerald-600 text-white font-bold rounded-2xl border border-green-400/20 shadow-lg flex items-center justify-center gap-2 transition-all"
        >
          <Navigation className="w-4 h-4" /> Route berechnen
        </button>
      </div>
    </motion.div>
  );
}