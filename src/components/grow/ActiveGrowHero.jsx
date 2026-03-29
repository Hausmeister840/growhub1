import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle, ArrowRight, Leaf, Zap, Heart } from 'lucide-react';
import { getStageStyle, getStageEmoji } from './GrowStageConfig';

export default function ActiveGrowHero({ diary }) {
  const navigate = useNavigate();
  const stage = diary.current_stage || 'Keimung';
  const style = getStageStyle(stage);
  const emoji = getStageEmoji(stage);
  const daysActive = diary.stats?.total_days || Math.max(0, Math.floor((Date.now() - new Date(diary.start_date).getTime()) / (1000 * 60 * 60 * 24)));
  const healthScore = diary.ai_insights?.health_score;
  const tasks = diary.grow_plan?.tasks || [];
  const overdue = tasks.filter(t => t.next_due && new Date(t.next_due).getTime() < Date.now());
  const nextDue = tasks
    .filter(t => t.next_due && new Date(t.next_due).getTime() > Date.now())
    .sort((a, b) => new Date(a.next_due) - new Date(b.next_due))[0];

  const nextDueLabel = nextDue ? (() => {
    const h = Math.round((new Date(nextDue.next_due).getTime() - Date.now()) / 3600000);
    return h < 1 ? 'Gleich fällig' : h < 24 ? `in ${h}h` : `in ${Math.round(h / 24)}d`;
  })() : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate(`/GrowDiaryDetail?id=${diary.id}`)}
      className="cursor-pointer group active:scale-[0.98] transition-transform"
    >
      <div className="relative rounded-2xl overflow-hidden border border-white/[0.08]">
        {/* Image or gradient background */}
        <div className="relative h-44">
          {diary.cover_image_url ? (
            <>
              <img src={diary.cover_image_url} alt={diary.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
            </>
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${style.gradient} opacity-15`} />
          )}

          {/* Top badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border backdrop-blur-md ${style.bg} ${style.text} ${style.border}`}>
              {emoji} {stage}
            </span>
            {healthScore != null && (
              <div className={`px-2.5 py-1 rounded-lg backdrop-blur-md text-[11px] font-black border flex items-center gap-1 ${
                healthScore >= 75 ? 'bg-green-500/20 border-green-500/30 text-green-400' :
                healthScore >= 50 ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' :
                'bg-red-500/20 border-red-500/30 text-red-400'
              }`}>
                <Heart className="w-2.5 h-2.5" />
                {healthScore}
              </div>
            )}
          </div>

          {/* Name + strain */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-lg font-black text-white leading-tight mb-0.5">{diary.name}</h3>
            {diary.strain_name && <p className="text-white/40 text-sm">{diary.strain_name}</p>}
          </div>
        </div>

        {/* Bottom status bar */}
        <div className="bg-white/[0.03] border-t border-white/[0.05] px-4 py-2.5 flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Leaf className="w-3 h-3 text-green-400" />
            <span>Tag {daysActive}</span>
          </div>

          {overdue.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-red-400 font-bold">
              <AlertTriangle className="w-3 h-3" />
              <span>{overdue.length} überfällig!</span>
            </div>
          )}

          {nextDue && overdue.length === 0 && (
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <Clock className="w-3 h-3" />
              <span className="truncate max-w-[120px]">{nextDue.title} {nextDueLabel}</span>
            </div>
          )}

          {!nextDue && overdue.length === 0 && (
            <div className="flex items-center gap-1 text-xs text-green-500/60">
              <Zap className="w-3 h-3" />
              <span>Kein Plan aktiv</span>
            </div>
          )}

          <div className="ml-auto flex items-center gap-1 text-xs text-green-400 font-semibold">
            Öffnen <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}