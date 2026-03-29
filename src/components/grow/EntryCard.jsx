import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Thermometer, Droplets, Trash2, Share2,
  AlertCircle, TrendingUp, Sparkles, Pencil, Activity, X, Globe, Eye
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import AIGrowTips from './AIGrowTips';

const STAGES = {
  'Keimung': { emoji: '🌱', color: 'bg-yellow-500' },
  'Sämling': { emoji: '🌿', color: 'bg-lime-500' },
  'Wachstum': { emoji: '🌳', color: 'bg-green-500' },
  'Blüte': { emoji: '🌸', color: 'bg-purple-500' },
  'Spülung': { emoji: '💧', color: 'bg-blue-500' },
  'Ernte': { emoji: '🏆', color: 'bg-orange-500' }
};

const HEALTH_MAP = {
  excellent: { label: 'Exzellent', color: 'bg-green-500/20 text-green-400 border-green-500/30', dot: 'bg-green-400' },
  good:      { label: 'Gut',       color: 'bg-lime-500/20 text-lime-400 border-lime-500/30',   dot: 'bg-lime-400' },
  fair:      { label: 'Mäßig',     color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', dot: 'bg-yellow-400' },
  poor:      { label: 'Schlecht',  color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', dot: 'bg-orange-400' },
  critical:  { label: 'Kritisch',  color: 'bg-red-500/20 text-red-400 border-red-500/30',     dot: 'bg-red-400' },
};

const QUICK_ACTION_LABELS = {
  watered: '💧 Gegossen', fertilized: '🧪 Gedüngt', repotted: '🪴 Umgetopft',
  topped: '✂️ Getoppt', lst: '🔗 LST', defoliated: '🍃 Entlaubt',
  flower_start: '🌸 Blütebeginn', problem: '⚠️ Problem', harvest: '🏆 Ernte', other: '📝 Sonstiges',
};

export default function EntryCard({ entry, diary, isOwner, onEdit, onDelete, onShare }) {
  const [showAITips, setShowAITips] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const stage = STAGES[entry.growth_stage] || STAGES['Keimung'];
  const hasAI = entry.ai_analysis?.health_assessment;
  const health = HEALTH_MAP[entry.ai_analysis?.health_assessment];
  const hasStats = entry.environment_data?.temp_c || entry.environment_data?.humidity_rh || 
                   entry.feeding_data?.ph || entry.feeding_data?.water_ml || entry.plant_height_cm;

  const handleDelete = useCallback(() => {
    if (confirmDelete) {
      onDelete(entry.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  }, [confirmDelete, entry.id, onDelete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800"
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 ${stage.color} rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>
            {stage.emoji}
          </div>
          <div>
            <h3 className="font-bold text-white leading-tight">Tag {entry.day_number}</h3>
            <p className="text-xs text-zinc-500">
              {formatDistanceToNow(new Date(entry.entry_date || entry.created_date), { addSuffix: true, locale: de })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Feed shared badge */}
          {entry.shared_to_feed && (
            <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/30">
              <Globe className="w-3 h-3" />
              Feed
            </span>
          )}
          {entry.visibility === 'profile' && !entry.shared_to_feed && (
            <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <Eye className="w-3 h-3" />
              Profil
            </span>
          )}
          {/* Health Badge */}
          {hasAI && health && (
            <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border ${health.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${health.dot}`} />
              {health.label}
            </span>
          )}

          {/* Owner Actions - always visible */}
          {isOwner && (
            <div className="flex items-center gap-0.5 ml-1">
              <button
                onClick={() => onEdit(entry)}
                className="p-2 hover:bg-zinc-700 rounded-xl transition-colors"
                title="Bearbeiten"
              >
                <Pencil className="w-4 h-4 text-zinc-400 hover:text-white" />
              </button>
              <button
                onClick={handleDelete}
                className={`p-2 rounded-xl transition-all ${confirmDelete ? 'bg-red-500/20' : 'hover:bg-zinc-700'}`}
                title={confirmDelete ? 'Nochmal tippen zum Bestätigen' : 'Löschen'}
              >
                {confirmDelete 
                  ? <X className="w-4 h-4 text-red-400" />
                  : <Trash2 className="w-4 h-4 text-zinc-400 hover:text-red-400" />
                }
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirm delete banner */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mx-4 mb-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between"
          >
            <span className="text-xs text-red-400">Wirklich löschen?</span>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="text-xs text-zinc-400 px-2 py-1 hover:text-white">Nein</button>
              <button onClick={() => onDelete(entry.id)} className="text-xs text-red-400 font-bold px-2 py-1 hover:text-red-300">Ja, löschen</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media */}
      {entry.media_urls && entry.media_urls.length > 0 && (
        <div className={entry.media_urls.length === 1 ? '' : 'grid grid-cols-2 gap-1 px-4'}>
          {entry.media_urls.length === 1 ? (
            <img
              src={entry.media_urls[0]}
              alt="Entry"
              className="w-full max-h-80 object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            entry.media_urls.slice(0, 4).map((url, idx) => (
              <div key={idx} className="relative">
                <img
                  src={url}
                  alt={`Entry ${idx + 1}`}
                  className="w-full aspect-square object-cover rounded-xl"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                {idx === 3 && entry.media_urls.length > 4 && (
                  <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">+{entry.media_urls.length - 4}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Observation */}
      {entry.plant_observation && (
        <div className="px-4 pt-3">
          <p className="text-sm text-zinc-300 leading-relaxed">{entry.plant_observation}</p>
        </div>
      )}

      {/* Quick Stats Row */}
      {hasStats && (
        <div className="px-4 pt-3 flex flex-wrap gap-2">
          {entry.plant_height_cm && (
            <span className="flex items-center gap-1 text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded-lg">
              <TrendingUp className="w-3 h-3 text-green-400" />{entry.plant_height_cm}cm
            </span>
          )}
          {entry.environment_data?.temp_c && (
            <span className="flex items-center gap-1 text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded-lg">
              <Thermometer className="w-3 h-3 text-orange-400" />{entry.environment_data.temp_c}°C
            </span>
          )}
          {entry.environment_data?.humidity_rh && (
            <span className="flex items-center gap-1 text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded-lg">
              <Droplets className="w-3 h-3 text-blue-400" />{entry.environment_data.humidity_rh}%
            </span>
          )}
          {entry.feeding_data?.ph && (
            <span className="flex items-center gap-1 text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded-lg">
              <Activity className="w-3 h-3 text-purple-400" />pH {entry.feeding_data.ph}
            </span>
          )}
          {entry.feeding_data?.water_ml && (
            <span className="flex items-center gap-1 text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded-lg">
              <Droplets className="w-3 h-3 text-cyan-400" />{entry.feeding_data.water_ml}ml
            </span>
          )}
        </div>
      )}

      {/* AI Analysis compact */}
      {hasAI && entry.ai_analysis.detected_issues?.length > 0 && (
        <div className="px-4 pt-3">
          <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 space-y-1">
            {entry.ai_analysis.detected_issues.slice(0, 2).map((issue, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <AlertCircle className="w-3 h-3 text-orange-400 flex-shrink-0 mt-0.5" />
                <span className="text-zinc-300">{issue.description || issue.issue_type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions / Actions taken */}
      {(entry.quick_actions?.length > 0 || entry.actions_taken?.length > 0) && (
        <div className="px-4 pt-3 flex flex-wrap gap-1.5">
          {(entry.quick_actions || entry.actions_taken || []).map((action, idx) => (
            <span key={idx} className="text-xs px-2 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-full">
              {QUICK_ACTION_LABELS[action] || action}
            </span>
          ))}
        </div>
      )}

      {/* Bottom Actions */}
      <div className="px-4 py-3 mt-2 flex items-center gap-2 border-t border-zinc-800/60">
        {isOwner && (
          <>
            <button
              onClick={() => onEdit(entry)}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-medium text-zinc-300 transition-all"
            >
              <Pencil className="w-3.5 h-3.5" />
              Bearbeiten
            </button>
            <button
              onClick={() => onShare(entry)}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-medium text-zinc-300 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              Teilen
            </button>
          </>
        )}
        <button
          onClick={() => setShowAITips(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ml-auto ${
            showAITips 
              ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          KI-Tipps
        </button>
      </div>

      {/* AI Tips */}
      <AnimatePresence>
        {showAITips && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <AIGrowTips entry={entry} diary={diary} compact={true} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}