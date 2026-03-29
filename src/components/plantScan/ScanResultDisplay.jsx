import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, CheckCircle, TrendingUp, TrendingDown,
  Target, Zap, Clock, Leaf, ChevronRight, Eye,
  Droplets, Sun, Activity, Microscope,
  Star, ThumbsUp, Sparkles
} from 'lucide-react';

function HealthGauge({ score }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : score >= 25 ? '#f97316' : '#ef4444';
  const label = score >= 80 ? 'Exzellent' : score >= 65 ? 'Gut' : score >= 50 ? 'Mittel' : score >= 25 ? 'Achtung' : 'Kritisch';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <motion.circle
            cx="60" cy="60" r={radius} fill="none"
            stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 10px ${color}60)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-white">{score}</span>
          <span className="text-xs text-zinc-500 font-medium">/100</span>
        </div>
      </div>
      <span className="text-sm font-bold mt-2" style={{ color }}>{label}</span>
    </div>
  );
}

function ScoreBar({ label, value, color = '#22c55e' }) {
  if (value === null || value === undefined) return null;
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-zinc-400">{label}</span>
        <span className="text-xs font-bold text-white">{Math.round(value)}</span>
      </div>
      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          className="h-full rounded-full"
          style={{ backgroundColor: value >= 75 ? '#22c55e' : value >= 50 ? '#eab308' : '#ef4444' }}
        />
      </div>
    </div>
  );
}

function VisualMarkerCard({ label, value, icon: Icon, status }) {
  if (!value) return null;
  const statusColors = {
    healthy: 'bg-green-500/10 border-green-500/20 text-green-400',
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    critical: 'bg-red-500/10 border-red-500/20 text-red-400',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  };
  return (
    <div className={`p-3 rounded-xl border ${statusColors[status] || statusColors.info}`}>
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        <span className="text-xs font-bold uppercase tracking-wider opacity-70">{label}</span>
      </div>
      <p className="text-sm font-medium text-white leading-snug">{value}</p>
    </div>
  );
}

function RiskFactorCard({ risk }) {
  const cfg = {
    critical: { border: 'border-red-500/30 bg-red-500/5', badge: 'bg-red-500/20 text-red-400', label: '🔴 Kritisch', dot: 'bg-red-500' },
    high:     { border: 'border-orange-500/30 bg-orange-500/5', badge: 'bg-orange-500/20 text-orange-400', label: '🟠 Hoch', dot: 'bg-orange-500' },
    medium:   { border: 'border-yellow-500/30 bg-yellow-500/5', badge: 'bg-yellow-500/20 text-yellow-400', label: '🟡 Mittel', dot: 'bg-yellow-500' },
    low:      { border: 'border-blue-500/30 bg-blue-500/5', badge: 'bg-blue-500/20 text-blue-400', label: '🔵 Niedrig', dot: 'bg-blue-400' },
  }[risk.severity] || { border: 'border-zinc-700 bg-zinc-900', badge: 'bg-zinc-700 text-zinc-300', label: 'Unbekannt', dot: 'bg-zinc-500' };

  return (
    <div className={`p-4 rounded-xl border ${cfg.border}`}>
      <div className="flex items-start justify-between mb-2 gap-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${cfg.dot}`} />
          <h4 className="text-white font-bold text-sm">{risk.title}</h4>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${cfg.badge}`}>{cfg.label}</span>
      </div>
      {risk.description && <p className="text-zinc-400 text-xs leading-relaxed">{risk.description}</p>}
    </div>
  );
}

function ActionItem({ action, index }) {
  const gradients = { urgent: 'from-red-500 to-orange-500', high: 'from-orange-500 to-yellow-500', medium: 'from-yellow-500 to-green-500', low: 'from-green-500 to-emerald-500' };
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className="flex items-start gap-3 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl"
    >
      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradients[action.priority] || gradients.medium} flex items-center justify-center flex-shrink-0`}>
        <span className="text-black font-black text-xs">{index + 1}</span>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-white font-bold text-sm">{action.title}</h4>
        {action.description && <p className="text-zinc-400 text-xs mt-1 leading-relaxed">{action.description}</p>}
        {action.timing && (
          <p className="text-xs text-green-400 mt-1.5 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {action.timing}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function ScanResultDisplay({ result, previousScans = [] }) {
  const [activeSection, setActiveSection] = useState('overview');
  if (!result) return null;

  const {
    health_score, quick_summary, overall_assessment, growth_stage, visual_markers,
    risk_factors, action_plan, environment_feedback, predicted_outcomes,
    trend_analysis, correlation_insights, plant_identification,
    score_breakdown, positive_observations
  } = result;

  const hasRisks = risk_factors?.length > 0;
  const hasActions = action_plan?.length > 0;
  const hasPrediction = predicted_outcomes?.estimated_yield_grams || predicted_outcomes?.days_to_harvest;
  const hasBreakdown = score_breakdown && Object.values(score_breakdown).some(v => v !== null && v !== undefined);

  const sections = [
    { id: 'overview', label: '📊 Übersicht' },
    { id: 'visual', label: '🔬 Visuell' },
    { id: 'risks', label: `⚠️ Risiken${hasRisks ? ` (${risk_factors.length})` : ''}` },
    { id: 'actions', label: `✅ Aktionsplan${hasActions ? ` (${action_plan.length})` : ''}` },
    ...(hasPrediction ? [{ id: 'prediction', label: '🎯 Prognose' }] : []),
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

      {/* Plant Identification */}
      {plant_identification && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-500/[0.08] via-emerald-500/[0.04] to-transparent border border-green-500/[0.20] rounded-2xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">{plant_identification.is_cannabis ? '🌿' : '🌱'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-white font-black text-base">{plant_identification.common_name}</p>
                {plant_identification.is_cannabis && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-green-500/15 text-green-400 rounded-md border border-green-500/20">Cannabis</span>
                )}
                {plant_identification.strain_type && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-purple-500/15 text-purple-400 rounded-md border border-purple-500/20">{plant_identification.strain_type}</span>
                )}
              </div>
              {growth_stage && (
                <p className="text-xs text-green-400 mt-0.5 flex items-center gap-1">
                  <Leaf className="w-3 h-3" /> {growth_stage}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Microscope className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-xs text-zinc-500">KI-Scan</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Health Score Hero */}
      <div className="bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-white/[0.01] border border-white/[0.10] rounded-2xl p-5">
        <div className="flex items-center gap-5">
          <HealthGauge score={health_score || 0} />
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-base mb-1">Plant Intelligence Score™</h3>
            {quick_summary && (
              <p className="text-green-300 text-sm font-medium mb-1.5">{quick_summary}</p>
            )}
            <p className="text-zinc-400 text-xs leading-relaxed">{overall_assessment}</p>
            {trend_analysis?.health_delta != null && (
              <div className={`mt-2 flex items-center gap-1 text-xs font-bold ${trend_analysis.health_delta > 0 ? 'text-green-400' : trend_analysis.health_delta < 0 ? 'text-red-400' : 'text-zinc-500'}`}>
                {trend_analysis.health_delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {trend_analysis.health_delta > 0 ? '+' : ''}{trend_analysis.health_delta} seit letztem Scan
              </div>
            )}
          </div>
        </div>

        {/* Score Breakdown */}
        {hasBreakdown && (
          <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-2 gap-3">
            <ScoreBar label="🍃 Blätter" value={score_breakdown.leaf} />
            <ScoreBar label="🌱 Wurzel" value={score_breakdown.root} />
            <ScoreBar label="🛡️ Schädlinge" value={score_breakdown.pest} />
            <ScoreBar label="🧪 Nährstoffe" value={score_breakdown.nutrient} />
          </div>
        )}

        {/* Positive observations */}
        {positive_observations?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <p className="text-xs font-bold text-green-400 mb-2 flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> Positives</p>
            <div className="space-y-1">
              {positive_observations.slice(0, 3).map((obs, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <Star className="w-3 h-3 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-zinc-300">{obs}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeSection === s.id ? 'bg-green-500 text-black' : 'bg-white/[0.04] text-zinc-400 border border-white/[0.06] hover:text-white'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Section Content */}
      <AnimatePresence mode="wait">

        {activeSection === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Environment */}
            {environment_feedback?.summary && (
              <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-2xl p-4">
                <h4 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Umgebungs-Feedback
                </h4>
                <p className="text-zinc-400 text-xs leading-relaxed">{environment_feedback.summary}</p>
                {environment_feedback.ph_recommendation && (
                  <div className="mt-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-xs text-blue-300 font-medium">💧 pH: {environment_feedback.ph_recommendation}</p>
                  </div>
                )}
                {environment_feedback.vpd_assessment && (
                  <div className="mt-2 px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <p className="text-xs text-purple-300 font-medium">💨 VPD: {environment_feedback.vpd_assessment}</p>
                  </div>
                )}
              </div>
            )}
            {/* Correlation insights */}
            {correlation_insights?.length > 0 && (
              <div className="bg-gradient-to-br from-purple-500/[0.06] to-white/[0.01] border border-purple-500/[0.15] rounded-2xl p-4">
                <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-400" /> KI-Erkenntnisse
                </h4>
                <div className="space-y-2">
                  {correlation_insights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <ChevronRight className="w-3 h-3 text-purple-400 mt-1 flex-shrink-0" />
                      <p className="text-zinc-300 text-xs">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Quick risk summary if any */}
            {hasRisks && (
              <div className="p-4 rounded-2xl bg-amber-500/[0.06] border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-amber-300">{risk_factors.length} Problem{risk_factors.length > 1 ? 'e' : ''} erkannt</span>
                </div>
                <div className="space-y-1">
                  {risk_factors.slice(0, 3).map((r, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${r.severity === 'critical' ? 'bg-red-500' : r.severity === 'high' ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                      <span className="text-xs text-zinc-300">{r.title}</span>
                    </div>
                  ))}
                </div>
                {risk_factors.length > 3 && (
                  <button onClick={() => setActiveSection('risks')} className="mt-2 text-xs text-amber-400 hover:text-amber-300 font-medium">
                    + {risk_factors.length - 3} weitere ansehen →
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}

        {activeSection === 'visual' && (
          <motion.div key="visual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {!visual_markers ? (
              <div className="text-center py-10 text-zinc-500 text-sm">Keine visuellen Daten verfügbar</div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <VisualMarkerCard label="Blattfarbe & -gesundheit" value={visual_markers.leaf_color_health} icon={Leaf}
                  status={visual_markers.leaf_color_health?.match(/gesund|optimal|kräftig/i) ? 'healthy' : 'warning'} />
                <VisualMarkerCard label="Blattspitzen" value={visual_markers.leaf_tip_status} icon={Leaf}
                  status={visual_markers.leaf_tip_status?.match(/normal|gesund/i) ? 'healthy' : 'warning'} />
                <VisualMarkerCard label="Stamm" value={visual_markers.stem_health} icon={Activity}
                  status={visual_markers.stem_health?.match(/gesund|kräftig|stark/i) ? 'healthy' : 'warning'} />
                <VisualMarkerCard label="Nährstoffbild" value={visual_markers.nutrient_markers} icon={Droplets}
                  status={visual_markers.nutrient_markers?.match(/optimal|ausgeglichen/i) ? 'healthy' : 'warning'} />
                <VisualMarkerCard label="Schädlinge" value={visual_markers.pest_indicators} icon={AlertTriangle}
                  status={visual_markers.pest_indicators?.match(/keine|nichts|sauber/i) ? 'healthy' : 'critical'} />
                <VisualMarkerCard label="Trichome" value={visual_markers.trichome_stage} icon={Eye} status="info" />
                <VisualMarkerCard label="Turgor" value={visual_markers.turgor_pressure} icon={Droplets}
                  status={visual_markers.turgor_pressure?.match(/gut|hoch|optimal/i) ? 'healthy' : 'warning'} />
                <VisualMarkerCard label="Licht-Stress" value={visual_markers.light_stress} icon={Sun}
                  status={visual_markers.light_stress?.match(/kein|keine|nicht/i) ? 'healthy' : 'warning'} />
                {visual_markers.root_zone && (
                  <div className="col-span-2">
                    <VisualMarkerCard label="Wurzelzone" value={visual_markers.root_zone} icon={Leaf} status="info" />
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {activeSection === 'risks' && (
          <motion.div key="risks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {hasRisks ? (
              <>
                {/* Sort by severity */}
                {[...risk_factors]
                  .sort((a, b) => {
                    const order = { critical: 0, high: 1, medium: 2, low: 3 };
                    return (order[a.severity] ?? 2) - (order[b.severity] ?? 2);
                  })
                  .map((risk, i) => <RiskFactorCard key={i} risk={risk} />)
                }
              </>
            ) : (
              <div className="text-center py-10">
                <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
                <p className="text-white font-bold">Keine Risiken erkannt!</p>
                <p className="text-zinc-500 text-sm mt-1">Deine Pflanze sieht sehr gesund aus 🌿</p>
              </div>
            )}
          </motion.div>
        )}

        {activeSection === 'actions' && (
          <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {hasActions ? (
              <>
                <p className="text-xs text-zinc-500 px-1">Sortiert nach Priorität – Dringlichstes zuerst</p>
                {[...action_plan]
                  .sort((a, b) => {
                    const order = { urgent: 0, high: 1, medium: 2, low: 3 };
                    return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
                  })
                  .map((action, i) => <ActionItem key={i} action={action} index={i} />)
                }
              </>
            ) : (
              <div className="text-center py-10">
                <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
                <p className="text-white font-bold">Alles optimal!</p>
                <p className="text-zinc-500 text-sm mt-1">Keine Anpassungen nötig – weiter so!</p>
              </div>
            )}
          </motion.div>
        )}

        {activeSection === 'prediction' && predicted_outcomes && (
          <motion.div key="prediction" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-gradient-to-br from-emerald-500/[0.06] to-white/[0.01] border border-emerald-500/[0.15] rounded-2xl p-5 space-y-4">
              <h4 className="text-white font-bold flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" /> KI-Erntprognose
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {predicted_outcomes.estimated_yield_grams > 0 && (
                  <div className="p-3 bg-white/[0.03] rounded-xl border border-white/[0.06] text-center">
                    <p className="text-xs text-zinc-500 mb-1">Geschätzter Ertrag</p>
                    <p className="text-2xl font-black text-green-400">{predicted_outcomes.estimated_yield_grams}g</p>
                  </div>
                )}
                {predicted_outcomes.days_to_harvest > 0 && (
                  <div className="p-3 bg-white/[0.03] rounded-xl border border-white/[0.06] text-center">
                    <p className="text-xs text-zinc-500 mb-1">Tage bis Ernte</p>
                    <p className="text-2xl font-black text-white">~{predicted_outcomes.days_to_harvest}</p>
                  </div>
                )}
                {predicted_outcomes.harvest_window && (
                  <div className="col-span-2 p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                    <p className="text-xs text-zinc-500 mb-1">Optimales Erntefenster</p>
                    <p className="text-sm font-bold text-emerald-400">{predicted_outcomes.harvest_window}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-zinc-400">Diese Prognose basiert auf dem aktuellen Pflanzen-Zustand und den Umgebungsparametern.</span>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}