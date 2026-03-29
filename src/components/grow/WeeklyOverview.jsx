import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, Droplets, Thermometer, Camera, ChevronLeft, ChevronRight, Zap, Heart } from 'lucide-react';
import { QUICK_ACTION_LABELS } from './GrowStageConfig';

export default function WeeklyOverview({ entries, diary }) {
  const weeks = useMemo(() => {
    if (!entries?.length) return [];
    const sorted = [...entries].sort((a, b) => a.day_number - b.day_number);
    const weekMap = {};
    sorted.forEach(e => {
      const w = Math.ceil(e.day_number / 7) || 1;
      if (!weekMap[w]) weekMap[w] = { week: w, entries: [], photos: 0, actions: {} };
      weekMap[w].entries.push(e);
      weekMap[w].photos += (e.media_urls?.length || 0);
      (e.quick_actions || e.actions_taken || []).forEach(a => {
        weekMap[w].actions[a] = (weekMap[w].actions[a] || 0) + 1;
      });
    });
    return Object.values(weekMap).sort((a, b) => b.week - a.week);
  }, [entries]);

  const [selectedWeek, setSelectedWeek] = useState(0);

  if (weeks.length === 0) {
    return (
      <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800 text-center">
        <Calendar className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
        <p className="text-sm text-zinc-500">Noch keine Einträge für die Wochenübersicht</p>
      </div>
    );
  }

  const week = weeks[selectedWeek];
  if (!week) return null;

  // Aggregate stats
  const temps = week.entries.map(e => e.environment_data?.temp_c).filter(Boolean);
  const humids = week.entries.map(e => e.environment_data?.humidity_rh).filter(Boolean);
  const heights = week.entries.map(e => e.plant_height_cm).filter(Boolean);
  const waters = week.entries.map(e => e.feeding_data?.water_ml).filter(Boolean);
  const healthScores = week.entries.map(e => {
    const h = e.ai_analysis?.health_assessment;
    return h === 'excellent' ? 100 : h === 'good' ? 80 : h === 'fair' ? 60 : h === 'poor' ? 40 : h === 'critical' ? 20 : null;
  }).filter(Boolean);

  const avg = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
  const heightGrowth = heights.length >= 2 ? (heights[heights.length - 1] - heights[0]).toFixed(1) : null;
  const totalWater = waters.reduce((s, w) => s + w, 0);
  const allPhotos = week.entries.flatMap(e => e.media_urls || []);
  const topActions = Object.entries(week.actions).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const avgHealth = avg(healthScores);
  const stagesUsed = [...new Set(week.entries.map(e => e.growth_stage))];

  return (
    <div className="space-y-4">
      {/* Week Selector */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSelectedWeek(Math.min(weeks.length - 1, selectedWeek + 1))}
          disabled={selectedWeek >= weeks.length - 1}
          className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-400 disabled:opacity-30 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <h3 className="text-white font-black text-lg">Woche {week.week}</h3>
          <p className="text-zinc-500 text-xs">
            Tag {(week.week - 1) * 7 + 1}–{week.week * 7} · {week.entries.length} Einträge
          </p>
        </div>
        <button
          onClick={() => setSelectedWeek(Math.max(0, selectedWeek - 1))}
          disabled={selectedWeek <= 0}
          className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-400 disabled:opacity-30 hover:text-white transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Stats Grid */}
      <motion.div
        key={week.week}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-2.5"
      >
        {avg(temps) != null && (
          <div className="bg-orange-500/[0.06] border border-orange-500/[0.12] rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Thermometer className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-[10px] text-orange-400/70 font-bold uppercase tracking-wider">Ø Temperatur</span>
            </div>
            <p className="text-xl font-black text-white">{avg(temps)}°C</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">
              {Math.min(...temps)}° – {Math.max(...temps)}°
            </p>
          </div>
        )}
        {avg(humids) != null && (
          <div className="bg-blue-500/[0.06] border border-blue-500/[0.12] rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Droplets className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] text-blue-400/70 font-bold uppercase tracking-wider">Ø Luftfeuchtigkeit</span>
            </div>
            <p className="text-xl font-black text-white">{avg(humids)}%</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">
              {Math.min(...humids)}% – {Math.max(...humids)}%
            </p>
          </div>
        )}
        {heightGrowth != null && (
          <div className="bg-green-500/[0.06] border border-green-500/[0.12] rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-green-400" />
              <span className="text-[10px] text-green-400/70 font-bold uppercase tracking-wider">Wachstum</span>
            </div>
            <p className="text-xl font-black text-white">+{heightGrowth} cm</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">
              {heights[0]} → {heights[heights.length - 1]} cm
            </p>
          </div>
        )}
        {totalWater > 0 && (
          <div className="bg-cyan-500/[0.06] border border-cyan-500/[0.12] rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] text-cyan-400/70 font-bold uppercase tracking-wider">Wasser gesamt</span>
            </div>
            <p className="text-xl font-black text-white">{totalWater >= 1000 ? `${(totalWater / 1000).toFixed(1)}L` : `${totalWater}ml`}</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">{waters.length} Gießvorgänge</p>
          </div>
        )}
        {avgHealth != null && (
          <div className="bg-purple-500/[0.06] border border-purple-500/[0.12] rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Heart className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[10px] text-purple-400/70 font-bold uppercase tracking-wider">Ø Gesundheit</span>
            </div>
            <p className="text-xl font-black text-white">{avgHealth}/100</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">
              {avgHealth >= 75 ? '🟢 Exzellent' : avgHealth >= 50 ? '🟡 Gut' : '🔴 Probleme'}
            </p>
          </div>
        )}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Camera className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Fotos</span>
          </div>
          <p className="text-xl font-black text-white">{week.photos}</p>
          <p className="text-[10px] text-zinc-600 mt-0.5">{week.entries.length} Einträge</p>
        </div>
      </motion.div>

      {/* Actions this week */}
      {topActions.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs font-bold text-white">Aktionen diese Woche</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {topActions.map(([action, count]) => (
              <span key={action} className="px-2.5 py-1 bg-zinc-800 border border-zinc-700/50 rounded-lg text-xs text-zinc-300 font-medium">
                {QUICK_ACTION_LABELS[action] || action} {count > 1 && <span className="text-zinc-500">×{count}</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Photo strip */}
      {allPhotos.length > 0 && (
        <div>
          <p className="text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">📸 Fotos der Woche</p>
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {allPhotos.slice(0, 8).map((url, i) => (
              <img key={i} src={url} alt="" className="w-20 h-20 rounded-xl object-cover flex-shrink-0 border border-white/[0.06]" onError={e => e.target.style.display='none'} />
            ))}
            {allPhotos.length > 8 && (
              <div className="w-20 h-20 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-zinc-400 font-bold">+{allPhotos.length - 8}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}