import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Droplets, Thermometer, Activity,
  Zap, Target
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const STAGE_DAYS = {
  'Keimung': { min: 3, max: 10, color: '#eab308' },
  'Sämling':  { min: 7, max: 21, color: '#84cc16' },
  'Wachstum': { min: 21, max: 60, color: '#22c55e' },
  'Blüte':    { min: 49, max: 77, color: '#a855f7' },
  'Spülung':  { min: 7, max: 14, color: '#3b82f6' },
  'Ernte':    { min: 1, max: 3,  color: '#f97316' },
};

const OPTIMAL_RANGES = {
  temp_c: { min: 20, max: 28, unit: '°C', label: 'Temperatur', icon: Thermometer, color: '#f97316' },
  humidity_rh: { min: 40, max: 70, unit: '%', label: 'Luftfeuchtigkeit', icon: Droplets, color: '#3b82f6' },
  ph: { min: 5.8, max: 6.8, unit: '', label: 'pH-Wert', icon: Activity, color: '#a855f7' },
};

function MiniGauge({ value, min, max, unit, label, icon: Icon, color }) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const inRange = value >= min && value <= max;

  return (
    <div className="bg-zinc-800/60 rounded-2xl p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5" style={{ color }} />
          <span className="text-xs text-zinc-400">{label}</span>
        </div>
        <span className={`text-xs font-bold ${inRange ? 'text-green-400' : 'text-red-400'}`}>
          {inRange ? '✓' : '⚠'}
        </span>
      </div>
      <p className="text-lg font-bold text-white leading-none">{value}{unit}</p>
      <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: inRange ? '#22c55e' : '#ef4444' }}
        />
      </div>
      <p className="text-[10px] text-zinc-600">Optimal: {min}–{max}{unit}</p>
    </div>
  );
}

function HeightChart({ entries }) {
  const data = useMemo(() => {
    return entries
      .filter(e => e.plant_height_cm)
      .sort((a, b) => a.day_number - b.day_number)
      .map(e => ({ day: `T${e.day_number}`, height: e.plant_height_cm }));
  }, [entries]);

  if (data.length < 2) return null;

  return (
    <div className="bg-zinc-800/60 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-green-400" />
        <p className="text-sm font-semibold text-white">Höhenwachstum</p>
        <span className="ml-auto text-xs text-zinc-500">{data[data.length - 1].height} cm</span>
      </div>
      <ResponsiveContainer width="100%" height={100}>
        <LineChart data={data}>
          <XAxis dataKey="day" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
          <Tooltip
            contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, fontSize: 12 }}
            labelStyle={{ color: '#a1a1aa' }}
            itemStyle={{ color: '#22c55e' }}
          />
          <Line
            type="monotone"
            dataKey="height"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ fill: '#22c55e', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function StageProgress({ currentStage, startDate, entries }) {
  const stageInfo = STAGE_DAYS[currentStage];
  if (!stageInfo) return null;

  const stageEntries = entries.filter(e => e.growth_stage === currentStage);
  const stageDays = stageEntries.length;
  const pct = Math.min(100, Math.round((stageDays / stageInfo.max) * 100));

  return (
    <div className="bg-zinc-800/60 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4" style={{ color: stageInfo.color }} />
          <p className="text-sm font-semibold text-white">Phase: {currentStage}</p>
        </div>
        <span className="text-xs text-zinc-500">Tag {stageDays}/{stageInfo.max}</span>
      </div>
      <div className="h-3 bg-zinc-700 rounded-full overflow-hidden mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: stageInfo.color }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-zinc-600">
        <span>Früh: {stageInfo.min} Tage</span>
        <span className="font-semibold" style={{ color: stageInfo.color }}>{pct}%</span>
        <span>Max: {stageInfo.max} Tage</span>
      </div>
    </div>
  );
}

function KeyEvents({ entries }) {
  const events = useMemo(() => {
    const evts = [];
    entries.forEach(e => {
      (e.actions_taken || []).forEach(action => {
        evts.push({
          day: e.day_number,
          date: e.entry_date || e.created_date,
          action,
          stage: e.growth_stage,
          key: `${e.id}-${action}`,
        });
      });
      if (e.milestone) {
        evts.push({
          day: e.day_number,
          date: e.entry_date || e.created_date,
          action: `🏁 Meilenstein: ${e.milestone_type || 'Wichtig'}`,
          stage: e.growth_stage,
          key: `${e.id}-milestone`,
          isMilestone: true,
        });
      }
    });
    return evts.sort((a, b) => a.day - b.day);
  }, [entries]);

  if (events.length === 0) return null;

  const ACTION_ICONS = {
    'Topping': '✂️', 'LST': '🪢', 'Defoliation': '🍂', 'Umgetopft': '🪴',
    'Düngung': '🧪', 'Schädlingsbehandlung': '🐛', 'Ernte': '🏆',
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-yellow-400" />
        <p className="text-sm font-bold text-white">Wichtige Ereignisse</p>
      </div>
      <div className="relative pl-5">
        <div className="absolute left-1.5 top-0 bottom-0 w-px bg-zinc-700" />
        <div className="space-y-3">
          {events.map((evt) => {
            const icon = Object.entries(ACTION_ICONS).find(([k]) => evt.action.includes(k))?.[1] || '📌';
            return (
              <div key={evt.key} className="relative flex items-start gap-3">
                <div className={`absolute -left-[14px] w-3 h-3 rounded-full border-2 border-zinc-900 flex-shrink-0 mt-0.5 ${evt.isMilestone ? 'bg-yellow-400' : 'bg-zinc-500'}`} />
                <div className="bg-zinc-800 rounded-xl px-3 py-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{icon}</span>
                    <span className="text-xs text-zinc-200 font-medium">{evt.action}</span>
                    <span className="ml-auto text-[10px] text-zinc-600">Tag {evt.day}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function PlantTrackingDashboard({ diary, entries }) {
  const latestEntry = entries[0];
  const env = latestEntry?.environment_data || {};
  const feed = latestEntry?.feeding_data || {};

  const avgHealth = useMemo(() => {
    const scored = entries.filter(e => e.ai_analysis?.health_assessment);
    if (!scored.length) return null;
    const map = { excellent: 5, good: 4, fair: 3, poor: 2, critical: 1 };
    const avg = scored.reduce((s, e) => s + (map[e.ai_analysis.health_assessment] || 3), 0) / scored.length;
    if (avg >= 4.5) return { label: 'Exzellent', color: 'text-green-400', score: avg };
    if (avg >= 3.5) return { label: 'Gut', color: 'text-lime-400', score: avg };
    if (avg >= 2.5) return { label: 'Mäßig', color: 'text-yellow-400', score: avg };
    return { label: 'Schlecht', color: 'text-red-400', score: avg };
  }, [entries]);

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-zinc-800/60 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-white">{entries.length}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Einträge</p>
        </div>
        <div className="bg-zinc-800/60 rounded-2xl p-3 text-center">
          <p className={`text-2xl font-bold ${avgHealth?.color || 'text-zinc-400'}`}>
            {avgHealth?.label || '—'}
          </p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Ø Gesundheit</p>
        </div>
        <div className="bg-zinc-800/60 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-white">
            {latestEntry?.plant_height_cm ? `${latestEntry.plant_height_cm}cm` : '—'}
          </p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Aktuelle Höhe</p>
        </div>
      </div>

      {/* Stage progress */}
      <StageProgress currentStage={diary.current_stage} startDate={diary.start_date} entries={entries} />

      {/* Height chart */}
      <HeightChart entries={entries} />

      {/* Live env gauges */}
      {latestEntry && (env.temp_c || env.humidity_rh || feed.ph) && (
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Aktuell (letzter Eintrag)</p>
          <div className="grid grid-cols-3 gap-2">
            {env.temp_c && (
              <MiniGauge
                value={env.temp_c}
                {...OPTIMAL_RANGES.temp_c}
              />
            )}
            {env.humidity_rh && (
              <MiniGauge
                value={env.humidity_rh}
                {...OPTIMAL_RANGES.humidity_rh}
              />
            )}
            {feed.ph && (
              <MiniGauge
                value={feed.ph}
                {...OPTIMAL_RANGES.ph}
              />
            )}
          </div>
        </div>
      )}

      {/* Key events timeline */}
      <KeyEvents entries={entries} />
    </div>
  );
}