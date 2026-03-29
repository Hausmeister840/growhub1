import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';
import { TrendingUp, Thermometer, Droplets, Activity, Droplet, Heart } from 'lucide-react';

const CHART_STYLE = {
  tooltip: { backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', color: '#fff' },
  label: { color: '#fff' },
  grid: '#27272a',
  axis: '#71717a',
};

const HEALTH_TO_NUM = { excellent: 100, good: 80, fair: 60, poor: 40, critical: 20 };

function ChartCard({ title, icon, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800"
    >
      <div className="flex items-center gap-2 mb-4">{icon}<h3 className="font-bold text-white text-sm">{title}</h3></div>
      {children}
    </motion.div>
  );
}

export default function GrowCharts({ entries }) {
  const [activeTab, setActiveTab] = useState('env');

  const chartData = useMemo(() => {
    if (!entries || entries.length === 0) return [];
    return entries
      .slice()
      .reverse()
      .map((entry, idx) => ({
        day: `T${entry.day_number || idx + 1}`,
        temp: entry.environment_data?.temp_c ?? null,
        humidity: entry.environment_data?.humidity_rh ?? null,
        height: entry.plant_height_cm ?? null,
        water: entry.feeding_data?.water_ml ?? null,
        ph: entry.feeding_data?.ph ?? null,
        health: entry.ai_analysis?.health_assessment
          ? HEALTH_TO_NUM[entry.ai_analysis.health_assessment]
          : null,
      }));
  }, [entries]);

  if (chartData.length < 2) return (
    <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 text-center text-sm text-zinc-500">
      Mindestens 2 Einträge für Charts nötig
    </div>
  );

  const tabs = [
    { id: 'env', label: 'Umgebung' },
    { id: 'growth', label: 'Wachstum' },
    { id: 'feeding', label: 'Nährstoffe' },
    { id: 'health', label: 'Gesundheit' },
  ];

  return (
    <div className="space-y-4">
      {/* Tab Switch */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
              activeTab === t.id ? 'bg-green-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Environment */}
      {activeTab === 'env' && (
        <div className="space-y-3">
          {chartData.some(d => d.temp) && (
            <ChartCard title="Temperatur (°C)" icon={<Thermometer className="w-4 h-4 text-orange-400" />}>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fb923c" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#fb923c" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.grid} />
                  <XAxis dataKey="day" stroke={CHART_STYLE.axis} tick={{ fill: CHART_STYLE.axis, fontSize: 10 }} />
                  <YAxis stroke={CHART_STYLE.axis} tick={{ fill: CHART_STYLE.axis, fontSize: 10 }} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={CHART_STYLE.tooltip} labelStyle={CHART_STYLE.label} formatter={(v) => [`${v}°C`, 'Temp']} />
                  <ReferenceLine y={26} stroke="#22c55e" strokeDasharray="4 2" label={{ value: 'Optimal', fill: '#22c55e', fontSize: 9 }} />
                  <Area type="monotone" dataKey="temp" stroke="#fb923c" fill="url(#gTemp)" strokeWidth={2} dot={{ r: 3, fill: '#fb923c' }} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
          {chartData.some(d => d.humidity) && (
            <ChartCard title="Luftfeuchtigkeit (%)" icon={<Droplets className="w-4 h-4 text-blue-400" />} delay={0.05}>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gHum" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.grid} />
                  <XAxis dataKey="day" stroke={CHART_STYLE.axis} tick={{ fill: CHART_STYLE.axis, fontSize: 10 }} />
                  <YAxis stroke={CHART_STYLE.axis} tick={{ fill: CHART_STYLE.axis, fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip contentStyle={CHART_STYLE.tooltip} labelStyle={CHART_STYLE.label} formatter={(v) => [`${v}%`, 'Luftf.']} />
                  <Area type="monotone" dataKey="humidity" stroke="#60a5fa" fill="url(#gHum)" strokeWidth={2} dot={{ r: 3, fill: '#60a5fa' }} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      )}

      {/* Growth */}
      {activeTab === 'growth' && chartData.some(d => d.height) && (
        <ChartCard title="Pflanzenhöhe (cm)" icon={<TrendingUp className="w-4 h-4 text-green-400" />}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.grid} />
              <XAxis dataKey="day" stroke={CHART_STYLE.axis} tick={{ fill: CHART_STYLE.axis, fontSize: 10 }} />
              <YAxis stroke={CHART_STYLE.axis} tick={{ fill: CHART_STYLE.axis, fontSize: 10 }} />
              <Tooltip contentStyle={CHART_STYLE.tooltip} labelStyle={CHART_STYLE.label} formatter={(v) => [`${v} cm`, 'Höhe']} />
              <Line type="monotone" dataKey="height" stroke="#22c55e" strokeWidth={3} dot={{ fill: '#22c55e', r: 4 }} activeDot={{ r: 6 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Feeding */}
      {activeTab === 'feeding' && (
        <div className="space-y-3">
          {chartData.some(d => d.ph) && (
            <ChartCard title="pH-Wert" icon={<Activity className="w-4 h-4 text-purple-400" />}>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.grid} />
                  <XAxis dataKey="day" stroke={CHART_STYLE.axis} tick={{ fill: CHART_STYLE.axis, fontSize: 10 }} />
                  <YAxis stroke={CHART_STYLE.axis} tick={{ fill: CHART_STYLE.axis, fontSize: 10 }} domain={[4, 8]} />
                  <Tooltip contentStyle={CHART_STYLE.tooltip} labelStyle={CHART_STYLE.label} formatter={(v) => [v, 'pH']} />
                  <ReferenceLine y={6.0} stroke="#22c55e" strokeDasharray="4 2" />
                  <ReferenceLine y={7.0} stroke="#22c55e" strokeDasharray="4 2" label={{ value: 'Optimal', fill: '#22c55e', fontSize: 9 }} />
                  <Line type="monotone" dataKey="ph" stroke="#a855f7" strokeWidth={2} dot={{ fill: '#a855f7', r: 3 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-zinc-600 mt-1">Grüne Linien = optimaler Bereich (6.0–7.0 Erde)</p>
            </ChartCard>
          )}
          {chartData.some(d => d.water) && (
            <ChartCard title="Bewässerung (ml)" icon={<Droplet className="w-4 h-4 text-cyan-400" />} delay={0.05}>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gWater" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.grid} />
                  <XAxis dataKey="day" stroke={CHART_STYLE.axis} tick={{ fill: CHART_STYLE.axis, fontSize: 10 }} />
                  <YAxis stroke={CHART_STYLE.axis} tick={{ fill: CHART_STYLE.axis, fontSize: 10 }} />
                  <Tooltip contentStyle={CHART_STYLE.tooltip} labelStyle={CHART_STYLE.label} formatter={(v) => [`${v} ml`, 'Wasser']} />
                  <Area type="monotone" dataKey="water" stroke="#22d3ee" fill="url(#gWater)" strokeWidth={2} dot={{ r: 3, fill: '#22d3ee' }} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      )}

      {/* Health Score */}
      {activeTab === 'health' && chartData.some(d => d.health) && (
        <ChartCard title="KI-Gesundheitsscore" icon={<Heart className="w-4 h-4 text-pink-400" />}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gHealth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.grid} />
              <XAxis dataKey="day" stroke={CHART_STYLE.axis} tick={{ fill: CHART_STYLE.axis, fontSize: 10 }} />
              <YAxis stroke={CHART_STYLE.axis} tick={{ fill: CHART_STYLE.axis, fontSize: 10 }} domain={[0, 100]} ticks={[20, 40, 60, 80, 100]} />
              <Tooltip contentStyle={CHART_STYLE.tooltip} labelStyle={CHART_STYLE.label} formatter={(v) => [
                v >= 80 ? `${v} – Gut` : v >= 60 ? `${v} – Ok` : `${v} – Probleme`, 'Gesundheit'
              ]} />
              <ReferenceLine y={60} stroke="#eab308" strokeDasharray="4 2" />
              <Area type="monotone" dataKey="health" stroke="#22c55e" fill="url(#gHealth)" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} connectNulls />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-zinc-600 mt-1">Nur Einträge mit KI-Analyse werden angezeigt</p>
        </ChartCard>
      )}

      {activeTab === 'health' && !chartData.some(d => d.health) && (
        <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 text-center text-sm text-zinc-500">
          Noch keine KI-analysierten Einträge. Analysiere Fotos im Eintrag, um Gesundheits-Daten zu sehen.
        </div>
      )}
      {activeTab === 'growth' && !chartData.some(d => d.height) && (
        <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 text-center text-sm text-zinc-500">
          Trage die Pflanzenhöhe in deinen Einträgen ein.
        </div>
      )}
    </div>
  );
}