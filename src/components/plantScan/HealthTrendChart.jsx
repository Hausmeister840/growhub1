import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 shadow-lg">
      <p className="text-xs text-zinc-400">{d.dateLabel}</p>
      <p className="text-sm font-black text-white">Score: {d.score}</p>
      {d.risks > 0 && <p className="text-xs text-red-400">{d.risks} Risiken</p>}
    </div>
  );
}

export default function HealthTrendChart({ scans, compact = false }) {
  if (!scans || scans.length < 2) {
    return (
      <div className="text-center py-8 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
        <p className="text-zinc-500 text-sm">Mindestens 2 Scans für den Trend nötig.</p>
      </div>
    );
  }

  const data = scans.map(s => {
    const risks = s.risk_factors?.length || s.analysis_result?.risk_factors?.length || 0;
    return {
      date: new Date(s.created_date).getTime(),
      dateLabel: format(new Date(s.created_date), 'dd. MMM, HH:mm', { locale: de }),
      score: typeof s.health_score === 'number' ? s.health_score : 50,
      risks,
    };
  });

  const first = data[0]?.score || 0;
  const last = data[data.length - 1]?.score || 0;
  const trend = last - first;

  return (
    <div className={`bg-white/[0.03] border border-white/[0.08] rounded-2xl ${compact ? 'p-3' : 'p-5'}`}>
      {!compact && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-bold text-white">Health Score Verlauf</p>
            <p className="text-xs text-zinc-500">{scans.length} Scans</p>
          </div>
          <div className={`flex items-center gap-1 text-sm font-bold ${
            trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-zinc-500'
          }`}>
            {trend > 0 ? <TrendingUp className="w-4 h-4" /> : trend < 0 ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
            {trend > 0 ? '+' : ''}{trend} Gesamt
          </div>
        </div>
      )}

      <div style={{ height: compact ? 80 : 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: compact ? -30 : 0 }}>
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            {!compact && (
              <>
                <XAxis dataKey="dateLabel" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<CustomTooltip />} />
              </>
            )}
            <ReferenceLine y={75} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.3} />
            <ReferenceLine y={50} stroke="#eab308" strokeDasharray="3 3" strokeOpacity={0.2} />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#scoreGrad)"
              dot={!compact}
              activeDot={!compact ? { r: 4, fill: '#22c55e' } : false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {compact && (
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-zinc-600">{scans.length} Scans</span>
          <span className={`text-[10px] font-bold ${trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-zinc-500'}`}>
            {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {trend > 0 ? '+' : ''}{trend}
          </span>
        </div>
      )}
    </div>
  );
}