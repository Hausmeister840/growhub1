import { motion } from 'framer-motion';
import { getStageStyle, getStageEmoji, QUICK_ACTION_LABELS, HEALTH_MAP } from './GrowStageConfig';
import { Thermometer, Droplets, TrendingUp, Activity, AlertCircle, Pencil, Trash2, Share2, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

function EntryMediaGrid({ urls }) {
  if (!urls?.length) return null;
  if (urls.length === 1) {
    return <img src={urls[0]} alt="" className="w-full max-h-72 object-cover rounded-xl" onError={e => e.target.style.display='none'} />;
  }
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {urls.slice(0, 4).map((url, i) => (
        <div key={i} className="relative">
          <img src={url} alt="" className="w-full aspect-square object-cover rounded-xl" onError={e => e.target.style.display='none'} />
          {i === 3 && urls.length > 4 && (
            <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">+{urls.length - 4}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function MetricPill({ icon, value, accent }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs bg-zinc-800/80 px-2.5 py-1 rounded-lg font-medium ${accent || 'text-zinc-400'}`}>
      {icon}{value}
    </span>
  );
}

function TimelineEntry({ entry, isOwner, onEdit, onDelete, onShare }) {
  const stage = getStageStyle(entry.growth_stage);
  const emoji = getStageEmoji(entry.growth_stage);
  const health = HEALTH_MAP[entry.ai_analysis?.health_assessment];
  const hasMetrics = entry.environment_data?.temp_c || entry.environment_data?.humidity_rh || entry.feeding_data?.ph || entry.plant_height_cm;
  const isMilestone = entry.milestone;

  // Calculate VPD if both temp and humidity exist
  const vpd = (() => {
    const t = entry.environment_data?.temp_c;
    const rh = entry.environment_data?.humidity_rh;
    if (!t || !rh) return null;
    return (0.6108 * Math.exp((17.27 * t) / (t + 237.3)) * (1 - rh / 100)).toFixed(2);
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Timeline dot + line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-zinc-800" />
      <div className={`absolute left-2 top-5 w-5 h-5 rounded-full ${stage.dot} flex items-center justify-center text-[10px] z-10 ring-4 ring-black ${isMilestone ? 'ring-yellow-500/30' : ''}`}>
        <span className="text-[10px]">{isMilestone ? '⭐' : emoji}</span>
      </div>

      <div className={`ml-12 bg-zinc-900/80 border rounded-2xl overflow-hidden ${isMilestone ? 'border-yellow-500/20' : 'border-zinc-800/60'}`}>
        {/* Header */}
        <div className="px-4 pt-3 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">Tag {entry.day_number}</span>
            {entry.week_number && <span className="text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">W{entry.week_number}</span>}
            <span className="text-zinc-600 text-xs">
              {formatDistanceToNow(new Date(entry.entry_date || entry.created_date), { addSuffix: true, locale: de })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {health && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${health.bg} ${health.color}`}>
                {health.emoji} {health.label}
              </span>
            )}
            {entry.shared_to_feed && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/30">📡</span>
            )}
          </div>
        </div>

        {/* Milestone badge */}
        {isMilestone && (
          <div className="mx-4 mb-2 flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <span className="text-sm">🏁</span>
            <span className="text-xs font-bold text-yellow-400">Meilenstein: {entry.milestone_type || 'Wichtig'}</span>
          </div>
        )}

        {/* Media */}
        {entry.media_urls?.length > 0 && (
          <div className="px-4 pb-2">
            <EntryMediaGrid urls={entry.media_urls} />
          </div>
        )}

        {/* Observation */}
        {entry.plant_observation && (
          <p className="px-4 pb-2 text-sm text-zinc-300 leading-relaxed">{entry.plant_observation}</p>
        )}

        {/* Metrics */}
        {hasMetrics && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5">
            {entry.plant_height_cm && <MetricPill icon={<TrendingUp className="w-3 h-3" />} value={`${entry.plant_height_cm}cm`} accent="text-green-400" />}
            {entry.environment_data?.temp_c && <MetricPill icon={<Thermometer className="w-3 h-3" />} value={`${entry.environment_data.temp_c}°C`} accent="text-orange-400" />}
            {entry.environment_data?.humidity_rh && <MetricPill icon={<Droplets className="w-3 h-3" />} value={`${entry.environment_data.humidity_rh}%`} accent="text-blue-400" />}
            {entry.feeding_data?.ph && <MetricPill icon={<Activity className="w-3 h-3" />} value={`pH ${entry.feeding_data.ph}`} accent="text-purple-400" />}
            {entry.feeding_data?.water_ml && <MetricPill icon={<Droplets className="w-3 h-3" />} value={`${entry.feeding_data.water_ml}ml`} accent="text-cyan-400" />}
            {vpd && <MetricPill icon={<Sparkles className="w-3 h-3" />} value={`VPD ${vpd}`} accent={parseFloat(vpd) >= 0.8 && parseFloat(vpd) <= 1.2 ? 'text-green-400' : 'text-yellow-400'} />}
          </div>
        )}

        {/* Quick actions */}
        {(entry.quick_actions?.length > 0 || entry.actions_taken?.length > 0) && (
          <div className="px-4 pb-2 flex flex-wrap gap-1">
            {(entry.quick_actions || entry.actions_taken || []).map((a, i) => (
              <span key={i} className="text-[11px] px-2 py-0.5 bg-zinc-800 border border-zinc-700/50 text-zinc-400 rounded-full font-medium">
                {QUICK_ACTION_LABELS[a] || a}
              </span>
            ))}
          </div>
        )}

        {/* AI Analysis Summary */}
        {entry.ai_analysis && (
          <div className="mx-4 mb-2 space-y-1.5">
            {entry.ai_analysis.detected_issues?.length > 0 && (
              <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 space-y-1">
                {entry.ai_analysis.detected_issues.slice(0, 2).map((issue, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <AlertCircle className="w-3 h-3 text-orange-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-orange-300 font-medium">{issue.issue_type}</span>
                      {issue.recommendation && <p className="text-zinc-400 mt-0.5">→ {issue.recommendation}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {entry.ai_analysis.positive_observations?.length > 0 && (!entry.ai_analysis.detected_issues?.length) && (
              <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
                <p className="text-xs text-green-400 font-medium">✓ {entry.ai_analysis.positive_observations[0]}</p>
              </div>
            )}
          </div>
        )}

        {/* Owner actions */}
        {isOwner && (
          <div className="px-4 pb-3 pt-1 flex items-center gap-2 border-t border-zinc-800/40">
            <button onClick={() => onEdit(entry)} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition-colors px-2 py-1.5 rounded-lg hover:bg-zinc-800">
              <Pencil className="w-3 h-3" /> Bearbeiten
            </button>
            <button onClick={() => onShare(entry)} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition-colors px-2 py-1.5 rounded-lg hover:bg-zinc-800">
              <Share2 className="w-3 h-3" /> Teilen
            </button>
            <button onClick={() => onDelete(entry.id)} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-red-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-zinc-800 ml-auto">
              <Trash2 className="w-3 h-3" /> Löschen
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function DiaryTimeline({ entries, diary, isOwner, onEdit, onDelete, onShare }) {
  return (
    <div className="relative space-y-4 py-2">
      {entries.map((entry) => (
        <TimelineEntry
          key={entry.id}
          entry={entry}
          isOwner={isOwner}
          onEdit={onEdit}
          onDelete={onDelete}
          onShare={onShare}
        />
      ))}
    </div>
  );
}