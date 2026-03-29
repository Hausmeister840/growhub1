import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Droplet, Sun, Activity, AlertTriangle, Camera, ChevronDown, ChevronUp, Sparkles,
  Zap, Target, TrendingUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const STAGE_COLORS = {
  'Keimung': 'from-yellow-500 to-amber-600',
  'Sämling': 'from-lime-500 to-green-600',
  'Wachstum': 'from-green-500 to-emerald-600',
  'Blüte': 'from-purple-500 to-pink-600',
  'Spülung': 'from-blue-500 to-cyan-600',
  'Ernte': 'from-orange-500 to-red-600'
};

const STAGE_ICONS = {
  'Keimung': '🌱',
  'Sämling': '🌿',
  'Wachstum': '🌳',
  'Blüte': '🌸',
  'Spülung': '💧',
  'Ernte': '🏆'
};

export default function GrowTimelineView({ 
  entries, 
  timelineGroups, 
  milestones, 
  diary,
  onEntryClick 
}) {
  const [expandedStages, setExpandedStages] = useState(
    Object.keys(timelineGroups).reduce((acc, stage) => {
      acc[stage] = true;
      return acc;
    }, {})
  );

  const toggleStage = (stage) => {
    setExpandedStages(prev => ({
      ...prev,
      [stage]: !prev[stage]
    }));
  };

  if (!entries || entries.length === 0) {
    return (
      <div className="glass-card rounded-3xl p-12 text-center border border-zinc-800">
        <Calendar className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Noch keine Einträge</h3>
        <p className="text-zinc-400 mb-6">
          Starte deine Grow-Chronik mit dem ersten Eintrag
        </p>
      </div>
    );
  }

  const stageOrder = ['Keimung', 'Sämling', 'Wachstum', 'Blüte', 'Spülung', 'Ernte'];
  const sortedStages = Object.keys(timelineGroups).sort((a, b) => {
    return stageOrder.indexOf(a) - stageOrder.indexOf(b);
  });

  return (
    <div className="space-y-6">
      {/* Timeline Header */}
      <div className="glass-card rounded-3xl p-6 border border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-green-500" />
            Grow Chronik
          </h2>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            {entries.length} {entries.length === 1 ? 'Eintrag' : 'Einträge'}
          </Badge>
        </div>

        {/* Milestones */}
        {milestones && milestones.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {milestones.map((milestone, idx) => (
              <Badge
                key={idx}
                className="bg-purple-500/20 text-purple-400 border-purple-500/30"
              >
                <Target className="w-3 h-3 mr-1" />
                Tag {milestone.day}: {getMilestoneLabel(milestone.type)}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Timeline by Stage */}
      <div className="space-y-6">
        {sortedStages.map(stage => {
          const stageEntries = timelineGroups[stage] || [];
          const isExpanded = expandedStages[stage];

          return (
            <motion.div
              key={stage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-3xl border border-zinc-800 overflow-hidden"
            >
              {/* Stage Header */}
              <button
                onClick={() => toggleStage(stage)}
                className="w-full p-6 flex items-center justify-between hover:bg-zinc-900/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${STAGE_COLORS[stage]} flex items-center justify-center text-2xl`}>
                    {STAGE_ICONS[stage]}
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-white">{stage}</h3>
                    <p className="text-sm text-zinc-400">
                      {stageEntries.length} {stageEntries.length === 1 ? 'Eintrag' : 'Einträge'}
                      {stageEntries.length > 0 && (
                        <span className="ml-2">
                          • Tag {stageEntries[0].day_number} - {stageEntries[stageEntries.length - 1].day_number}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {isExpanded ? (
                  <ChevronUp className="w-6 h-6 text-zinc-400" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-zinc-400" />
                )}
              </button>

              {/* Stage Entries */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-zinc-800"
                  >
                    <div className="p-6 space-y-4">
                      {stageEntries.map((entry, idx) => (
                        <EntryCard
                          key={entry.id}
                          entry={entry}
                          onClick={() => onEntryClick(entry)}
                          isLast={idx === stageEntries.length - 1}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function EntryCard({ entry, onClick, isLast }) {
  const hasAIAnalysis = entry.ai_analysis && entry.ai_analysis.health_assessment;
  const hasIssues = entry.ai_analysis?.detected_issues?.length > 0;
  const hasPhotos = entry.media_urls && entry.media_urls.length > 0;

  const healthColor = {
    'excellent': 'text-green-500',
    'good': 'text-lime-500',
    'fair': 'text-yellow-500',
    'poor': 'text-orange-500',
    'critical': 'text-red-500'
  }[entry.ai_analysis?.health_assessment] || 'text-zinc-500';

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="glass-card rounded-2xl p-4 border border-zinc-800 hover:border-green-500/30 transition-all cursor-pointer"
      onClick={onClick}
    >
      {/* Entry Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
            <span className="text-lg font-bold text-white">{entry.day_number}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-white">Tag {entry.day_number}</p>
              {entry.milestone && (
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Meilenstein
                </Badge>
              )}
            </div>
            <p className="text-xs text-zinc-500">
              {entry.entry_date ? format(new Date(entry.entry_date), 'dd. MMM yyyy, HH:mm', { locale: de }) : 'Kein Datum'}
            </p>
          </div>
        </div>

        {hasAIAnalysis && (
          <div className="flex items-center gap-2">
            <Activity className={`w-5 h-5 ${healthColor}`} />
            {hasIssues && (
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
            )}
          </div>
        )}
      </div>

      {/* Observation */}
      {entry.plant_observation && (
        <p className="text-sm text-zinc-300 mb-3 line-clamp-2">
          "{entry.plant_observation}"
        </p>
      )}

      {/* Quick Stats */}
      <div className="flex flex-wrap gap-3 mb-3">
        {entry.plant_height_cm && (
          <div className="flex items-center gap-1 text-xs text-zinc-400">
            <TrendingUp className="w-3 h-3" />
            {entry.plant_height_cm} cm
          </div>
        )}
        {entry.environment_data?.temp_c && (
          <div className="flex items-center gap-1 text-xs text-zinc-400">
            <Sun className="w-3 h-3" />
            {entry.environment_data.temp_c}°C
          </div>
        )}
        {entry.environment_data?.humidity_rh && (
          <div className="flex items-center gap-1 text-xs text-zinc-400">
            <Droplet className="w-3 h-3" />
            {entry.environment_data.humidity_rh}%
          </div>
        )}
        {entry.feeding_data?.ph && (
          <div className="flex items-center gap-1 text-xs text-zinc-400">
            <Activity className="w-3 h-3" />
            pH {entry.feeding_data.ph}
          </div>
        )}
        {hasPhotos && (
          <div className="flex items-center gap-1 text-xs text-zinc-400">
            <Camera className="w-3 h-3" />
            {entry.media_urls.length}
          </div>
        )}
      </div>

      {/* Actions */}
      {entry.actions_taken && entry.actions_taken.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {entry.actions_taken.slice(0, 3).map((action, idx) => (
            <Badge
              key={idx}
              variant="outline"
              className="text-xs border-zinc-700 text-zinc-400"
            >
              {action}
            </Badge>
          ))}
          {entry.actions_taken.length > 3 && (
            <Badge
              variant="outline"
              className="text-xs border-zinc-700 text-zinc-400"
            >
              +{entry.actions_taken.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* AI Analysis Preview */}
      {hasAIAnalysis && entry.ai_analysis.detailed_analysis && (
        <div className="mt-3 p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-semibold text-purple-400">KI-Analyse</span>
          </div>
          <p className="text-xs text-zinc-400 line-clamp-2">
            {entry.ai_analysis.detailed_analysis}
          </p>
        </div>
      )}
    </motion.div>
  );
}

function getMilestoneLabel(type) {
  const labels = {
    'germination': 'Keimung',
    'first_leaves': 'Erste Blätter',
    'topped': 'Getoppt',
    'flowering_start': 'Blüte Start',
    'harvest': 'Ernte'
  };
  return labels[type] || type;
}