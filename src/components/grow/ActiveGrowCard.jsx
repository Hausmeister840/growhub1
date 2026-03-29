import { motion } from 'framer-motion';
import { Calendar, Camera } from 'lucide-react';

const STAGE_CONFIG = {
  'Keimung': { emoji: '🌱', color: 'from-yellow-500/20 to-yellow-600/10', border: 'border-yellow-500/30', text: 'text-yellow-400' },
  'Sämling': { emoji: '🌿', color: 'from-lime-500/20 to-lime-600/10', border: 'border-lime-500/30', text: 'text-lime-400' },
  'Wachstum': { emoji: '🌳', color: 'from-green-500/20 to-green-600/10', border: 'border-green-500/30', text: 'text-green-400' },
  'Blüte': { emoji: '🌸', color: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-500/30', text: 'text-purple-400' },
  'Spülung': { emoji: '💧', color: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/30', text: 'text-blue-400' },
  'Ernte': { emoji: '🏆', color: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-500/30', text: 'text-orange-400' }
};

export default function ActiveGrowCard({ diary, onClick, index }) {
  const stage = diary.current_stage || 'Keimung';
  const config = STAGE_CONFIG[stage] || STAGE_CONFIG['Keimung'];
  const daysActive = diary.stats?.total_days || Math.floor((Date.now() - new Date(diary.start_date).getTime()) / (1000 * 60 * 60 * 24));
  const healthScore = diary.ai_insights?.health_score;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      onClick={onClick}
      className={`bg-gradient-to-br ${config.color} border ${config.border} rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform`}
    >
      {/* Image */}
      {diary.cover_image_url ? (
        <div className="relative h-40 overflow-hidden">
          <img
            src={diary.cover_image_url}
            alt={diary.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="font-bold text-white text-lg leading-tight truncate">{diary.name}</h3>
            <p className="text-white/70 text-xs">{diary.strain_name}</p>
          </div>
          <div className="absolute top-3 right-3 text-3xl">{config.emoji}</div>
        </div>
      ) : (
        <div className="p-4 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-lg leading-tight truncate">{diary.name}</h3>
              <p className="text-zinc-400 text-sm">{diary.strain_name}</p>
            </div>
            <span className="text-3xl ml-2">{config.emoji}</span>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="p-4 space-y-3">
        {/* Stage & Health */}
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full bg-black/30 ${config.text}`}>
            {stage}
          </span>
          {healthScore != null && (
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${
                healthScore >= 80 ? 'bg-green-400' : healthScore >= 50 ? 'bg-yellow-400' : 'bg-red-400'
              }`} />
              <span className="text-xs text-zinc-400">{healthScore}%</span>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Tag {daysActive}</span>
          </div>
          {diary.setup_type && (
            <span>{diary.setup_type === 'indoor' ? '🏠' : diary.setup_type === 'outdoor' ? '☀️' : '🏡'}</span>
          )}
          {diary.stats?.total_photos > 0 && (
            <div className="flex items-center gap-1">
              <Camera className="w-3.5 h-3.5" />
              <span>{diary.stats.total_photos}</span>
            </div>
          )}
          {diary.plant_count > 1 && (
            <span>×{diary.plant_count}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}