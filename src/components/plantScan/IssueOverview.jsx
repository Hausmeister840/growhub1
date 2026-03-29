import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Bug, Beaker, Leaf, Shield, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

const SEVERITY_CONFIG = {
  critical: { color: 'border-red-500/30 bg-red-500/8', badge: 'bg-red-500/20 text-red-400', label: 'Kritisch', order: 0 },
  high: { color: 'border-orange-500/30 bg-orange-500/8', badge: 'bg-orange-500/20 text-orange-400', label: 'Hoch', order: 1 },
  medium: { color: 'border-yellow-500/30 bg-yellow-500/8', badge: 'bg-yellow-500/20 text-yellow-400', label: 'Mittel', order: 2 },
  low: { color: 'border-blue-500/30 bg-blue-500/8', badge: 'bg-blue-500/20 text-blue-400', label: 'Niedrig', order: 3 },
};

function IssueCard({ issue, index }) {
  const config = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.medium;
  const isPest = /schädling|pest|insekt|milbe|thrip|blattlaus/i.test(issue.title);
  const isNutrient = /nährstoff|mangel|überschuss|defiz|chlor|stickstoff|kalium|phosphor/i.test(issue.title);
  const Icon = isPest ? Bug : isNutrient ? Beaker : Leaf;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`p-3.5 rounded-xl border ${config.color}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon className="w-4 h-4 text-zinc-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-bold text-white truncate">{issue.title}</p>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${config.badge} flex-shrink-0`}>
              {config.label}
            </span>
          </div>
          {issue.description && (
            <p className="text-xs text-zinc-400 leading-relaxed mt-0.5">{issue.description}</p>
          )}
          {issue.scan_date && (
            <p className="text-[10px] text-zinc-600 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(issue.scan_date), { addSuffix: true, locale: de })}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function IssueOverview({ latestRisks = [], allIssues = [], recurring = [] }) {
  // Sort latest risks by severity
  const sortedLatest = [...latestRisks].sort((a, b) => {
    const aOrder = SEVERITY_CONFIG[a.severity]?.order ?? 2;
    const bOrder = SEVERITY_CONFIG[b.severity]?.order ?? 2;
    return aOrder - bOrder;
  });

  const hasCritical = sortedLatest.some(r => r.severity === 'critical' || r.severity === 'high');

  return (
    <div className="space-y-4">
      {/* Current scan issues */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-zinc-500" />
          <span className="text-sm font-bold text-white">Aktuelle Probleme</span>
          {hasCritical && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 animate-pulse">
              Achtung
            </span>
          )}
        </div>

        {sortedLatest.length > 0 ? (
          <div className="space-y-2">
            {sortedLatest.map((risk, i) => (
              <IssueCard key={i} issue={risk} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-green-500/[0.04] border border-green-500/20 rounded-2xl">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <p className="text-white font-bold text-sm">Keine Probleme erkannt</p>
            <p className="text-zinc-500 text-xs">Deine Pflanze sieht gesund aus!</p>
          </div>
        )}
      </div>

      {/* Recurring issues */}
      {recurring.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-white">Wiederkehrende Muster</span>
          </div>
          <div className="space-y-1.5">
            {recurring.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-amber-500/[0.05] border border-amber-500/15">
                <span className="text-sm text-zinc-300">{r.title}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-amber-400">{r.count}×</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: Math.min(r.count, 5) }).map((_, j) => (
                      <div key={j} className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All-time stats */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Gesamtstatistik</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-lg font-black text-white">{allIssues.length}</p>
            <p className="text-[10px] text-zinc-500">Probleme total</p>
          </div>
          <div>
            <p className="text-lg font-black text-white">{recurring.length}</p>
            <p className="text-[10px] text-zinc-500">Wiederkehrend</p>
          </div>
          <div>
            <p className="text-lg font-black text-white">
              {allIssues.filter(i => i.severity === 'critical' || i.severity === 'high').length}
            </p>
            <p className="text-[10px] text-zinc-500">Kritisch/Hoch</p>
          </div>
        </div>
      </div>
    </div>
  );
}