import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Camera, Activity, Thermometer, AlertTriangle, Heart, Clock, TrendingUp, Leaf } from 'lucide-react';
import { getStageStyle, getStageEmoji, STAGES } from './GrowStageConfig';

function HealthRing({ score, size = 56 }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : score >= 25 ? '#f97316' : '#ef4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <motion.circle
          cx={size/2} cy={size/2} r={radius} fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-black text-white leading-none">{score}</span>
      </div>
    </div>
  );
}

function StatBox({ icon, value, label, accent }) {
  return (
    <div className="flex flex-col items-center bg-white/[0.03] border border-white/[0.06] rounded-2xl p-2.5 flex-1">
      <div className={`mb-0.5 ${accent || 'text-zinc-500'}`}>{icon}</div>
      <span className="text-base font-bold text-white leading-none">{value}</span>
      <span className="text-[9px] text-zinc-500 mt-1 font-medium">{label}</span>
    </div>
  );
}

export default function DiaryHeader({ diary, entries, onStageChange, editable }) {
  const stage = diary.current_stage || 'Keimung';
  const style = getStageStyle(stage);
  const emoji = getStageEmoji(stage);
  const totalDays = diary.stats?.total_days || Math.max(0, Math.floor((Date.now() - new Date(diary.start_date).getTime()) / (1000 * 60 * 60 * 24)));
  const photoCount = entries.reduce((sum, e) => sum + (e.media_urls?.length || 0), 0);
  const latestEntry = entries[0];

  // AI health score
  const healthScore = diary.ai_insights?.health_score;

  // Calculate VPD from latest entry
  const vpd = useMemo(() => {
    const temp = latestEntry?.environment_data?.temp_c;
    const rh = latestEntry?.environment_data?.humidity_rh;
    if (!temp || !rh) return null;
    const svp = 0.6108 * Math.exp((17.27 * temp) / (temp + 237.3));
    return (svp * (1 - rh / 100)).toFixed(2);
  }, [latestEntry]);

  // Days since last entry
  const daysSinceEntry = useMemo(() => {
    if (!latestEntry) return null;
    const d = new Date(latestEntry.entry_date || latestEntry.created_date);
    return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  }, [latestEntry]);

  // Growth rate
  const growthRate = useMemo(() => {
    const withHeight = entries.filter(e => e.plant_height_cm).sort((a, b) => a.day_number - b.day_number);
    if (withHeight.length < 2) return null;
    const last = withHeight[withHeight.length - 1];
    const prev = withHeight[withHeight.length - 2];
    const diff = last.plant_height_cm - prev.plant_height_cm;
    const dayDiff = last.day_number - prev.day_number;
    if (dayDiff <= 0) return null;
    return (diff / dayDiff).toFixed(1);
  }, [entries]);

  // Overdue tasks
  const overdueTasks = (diary.grow_plan?.tasks || []).filter(t => t.next_due && new Date(t.next_due).getTime() < Date.now());

  return (
    <div className="space-y-4">
      {/* Cover */}
      {diary.cover_image_url && (
        <div className="relative h-52 -mx-4 -mt-4 overflow-hidden">
          <img src={diary.cover_image_url} alt={diary.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          {/* Health score overlay */}
          {healthScore != null && (
            <div className="absolute bottom-3 right-3">
              <HealthRing score={healthScore} />
            </div>
          )}
        </div>
      )}

      {/* Identity */}
      <div className="flex items-start gap-3.5">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${style.gradient} flex items-center justify-center text-2xl flex-shrink-0 shadow-lg`}>
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-black text-white leading-tight">{diary.name}</h2>
          {diary.strain_name && <p className="text-zinc-400 text-sm mt-0.5">{diary.strain_name}</p>}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
              {emoji} {stage}
            </span>
            <span className="text-[11px] text-zinc-500">
              {diary.setup_type === 'indoor' ? '🏠 Indoor' : diary.setup_type === 'outdoor' ? '☀️ Outdoor' : '🏡 Gewächshaus'}
            </span>
            {diary.plant_count > 1 && <span className="text-[11px] text-zinc-500">×{diary.plant_count}</span>}
            {diary.grow_method && <span className="text-[11px] text-zinc-500">· {diary.grow_method}</span>}
          </div>
        </div>
        {/* Health ring wenn kein Cover */}
        {!diary.cover_image_url && healthScore != null && (
          <HealthRing score={healthScore} />
        )}
      </div>

      {/* Last activity warning */}
      {daysSinceEntry != null && daysSinceEntry > 2 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          <Clock className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-xs text-yellow-400 font-medium">
            Letzter Eintrag vor {daysSinceEntry} Tagen
          </span>
        </div>
      )}

      {/* Overdue tasks warning */}
      {overdueTasks.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs text-red-400 font-medium">
            {overdueTasks.length} {overdueTasks.length === 1 ? 'Aufgabe' : 'Aufgaben'} überfällig
          </span>
        </div>
      )}

      {/* Phase Progress Bar */}
      {editable && (
        <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar pb-1">
          {STAGES.map((s) => {
            const isCurrent = s.id === stage;
            return (
              <button
                key={s.id}
                onClick={() => onStageChange?.(s.id)}
                className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                  isCurrent ? 'bg-green-500 text-black' : 'bg-zinc-800 text-zinc-500 hover:text-white'
                }`}
              >
                {s.emoji} {s.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2">
        <StatBox icon={<Calendar className="w-3.5 h-3.5" />} value={totalDays} label="Tage" />
        <StatBox icon={<Camera className="w-3.5 h-3.5" />} value={photoCount} label="Fotos" />
        <StatBox icon={<Activity className="w-3.5 h-3.5" />} value={entries.length} label="Einträge" />
        {growthRate != null ? (
          <StatBox icon={<TrendingUp className="w-3.5 h-3.5" />} value={`${growthRate}`} label="cm/Tag" accent="text-green-400" />
        ) : vpd != null ? (
          <StatBox icon={<Leaf className="w-3.5 h-3.5" />} value={vpd} label="VPD kPa" accent={parseFloat(vpd) >= 0.8 && parseFloat(vpd) <= 1.2 ? 'text-green-400' : 'text-yellow-400'} />
        ) : latestEntry?.environment_data?.temp_c ? (
          <StatBox icon={<Thermometer className="w-3.5 h-3.5" />} value={`${latestEntry.environment_data.temp_c}°`} label="Letzte T°" accent="text-orange-400" />
        ) : (
          <StatBox icon={<Heart className="w-3.5 h-3.5" />} value={healthScore ?? '—'} label="Health" accent="text-green-400" />
        )}
      </div>

      {/* AI Insights Summary */}
      {diary.ai_insights?.last_analysis_summary && (
        <div className="bg-purple-500/[0.06] border border-purple-500/[0.12] rounded-2xl p-3.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Heart className="w-3 h-3 text-purple-400" />
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">KI-Einschätzung</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2">{diary.ai_insights.last_analysis_summary}</p>
        </div>
      )}
    </div>
  );
}