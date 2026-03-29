import { motion } from 'framer-motion';
import { Calendar, TrendingUp, AlertTriangle, Clock } from 'lucide-react';
import { getStageStyle, getStageEmoji } from './GrowStageConfig';

function MiniHealthRing({ score }) {
  const r = 12;
  const circ = 2 * Math.PI * r;
  const prog = (score / 100) * circ;
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444';
  return (
    <div className="relative w-8 h-8">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 28 28">
        <circle cx="14" cy="14" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <circle cx="14" cy="14" r={r} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ - prog} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white">{score}</span>
    </div>
  );
}

export default function DiaryCard({ diary, onClick, index }) {
  const stage = diary.current_stage || 'Keimung';
  const style = getStageStyle(stage);
  const emoji = getStageEmoji(stage);
  const daysActive = diary.stats?.total_days || Math.max(0, Math.floor((Date.now() - new Date(diary.start_date).getTime()) / (1000 * 60 * 60 * 24)));
  const isCompleted = diary.status === 'completed';
  const healthScore = diary.ai_insights?.health_score;

  const tasks = diary.grow_plan?.tasks || [];
  const overdue = tasks.filter(t => t.next_due && new Date(t.next_due).getTime() < Date.now()).length;

  // Growth trend from stats
  const entryCount = diary.stats?.total_entries || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="cursor-pointer group active:scale-[0.97] transition-transform"
    >
      <div className="gh-card overflow-hidden">
        {/* Image / Gradient Header */}
        <div className="relative h-44 overflow-hidden">
          {diary.cover_image_url ? (
            <>
              <img src={diary.cover_image_url} alt={diary.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            </>
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${style.gradient} opacity-15 flex items-center justify-center`}>
              <span className="text-5xl opacity-30">{emoji}</span>
            </div>
          )}

          {/* Top row: Stage + Health */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border backdrop-blur-sm ${style.bg} ${style.text} ${style.border}`}>
              {emoji} {stage}
            </span>
            {healthScore != null && <MiniHealthRing score={healthScore} />}
          </div>

          {/* Completed check */}
          {isCompleted && (
            <div className="absolute top-2.5 right-2.5 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-sm">✓</span>
            </div>
          )}

          {/* Overdue indicator */}
          {overdue > 0 && !isCompleted && (
            <div className="absolute top-12 right-2.5 flex items-center gap-1 px-1.5 py-0.5 bg-red-500/90 backdrop-blur-sm rounded-md">
              <AlertTriangle className="w-2.5 h-2.5 text-white" />
              <span className="text-[9px] font-bold text-white">{overdue}</span>
            </div>
          )}

          {/* Name overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="font-bold text-white text-sm leading-tight truncate">{diary.name}</h3>
            {diary.strain_name && (
              <p className="text-white/50 text-[11px] truncate mt-0.5">{diary.strain_name}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-3 py-2.5 flex items-center justify-between border-t border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[11px] text-zinc-500">
              <Calendar className="w-3 h-3" />
              <span>Tag {daysActive}</span>
            </div>
            {entryCount > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                <TrendingUp className="w-3 h-3" />
                <span>{entryCount}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            {overdue > 0 ? (
              <span className="text-red-400 font-semibold flex items-center gap-0.5">
                <Clock className="w-3 h-3" /> {overdue} fällig
              </span>
            ) : tasks.length > 0 ? (
              <span className="text-green-400 font-medium">✓ Plan aktiv</span>
            ) : (
              <span className="text-zinc-600">{diary.setup_type === 'indoor' ? '🏠' : diary.setup_type === 'outdoor' ? '☀️' : '🏡'}</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}