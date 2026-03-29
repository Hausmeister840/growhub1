import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Camera, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Zap, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { de } from 'date-fns/locale';

function HealthBar({ score }) {
  const color = score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={`h-full ${color} rounded-full`}
      />
    </div>
  );
}

function HealthBadge({ score }) {
  if (score >= 80) return <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-md">Exzellent</span>;
  if (score >= 65) return <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">Gut</span>;
  if (score >= 45) return <span className="text-[10px] font-bold text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded-md">Mittel</span>;
  return <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-md">Kritisch</span>;
}

function TrendIcon({ current, prev }) {
  if (!prev) return null;
  if (current > prev + 2) return <TrendingUp className="w-3.5 h-3.5 text-green-400" />;
  if (current < prev - 2) return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
  return <Minus className="w-3.5 h-3.5 text-zinc-500" />;
}

function ScanCard({ scan, prevScan, index, isLast }) {
  const [expanded, setExpanded] = useState(false);
  const result = scan.analysis_result || {};
  const score = scan.health_score ?? result.health_score ?? 0;
  const prevScore = prevScan?.health_score ?? prevScan?.analysis_result?.health_score ?? null;
  const issues = scan.risk_factors || result.risk_factors || [];
  const actions = scan.action_plan || result.action_plan || [];
  const summary = result.executive_summary || result.summary || '';

  return (
    <div className="flex gap-3">
      {/* Timeline line */}
      <div className="flex flex-col items-center flex-shrink-0 w-8">
        <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 mt-1 ${
          score >= 75 ? 'border-green-500 bg-green-500/30' :
          score >= 50 ? 'border-yellow-500 bg-yellow-500/30' :
          'border-red-500 bg-red-500/30'
        }`} />
        {!isLast && <div className="w-0.5 flex-1 bg-white/[0.06] mt-1 min-h-[24px]" />}
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.06 }}
        className="flex-1 mb-4"
      >
        <div
          className="gh-card overflow-hidden cursor-pointer"
          onClick={() => setExpanded(e => !e)}
        >
          <div className="flex gap-3 p-3">
            {/* Image */}
            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-900">
              {scan.image_url ? (
                <img src={scan.image_url} alt="Scan" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className="w-5 h-5 text-zinc-600" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <HealthBadge score={score} />
                <TrendIcon current={score} prev={prevScore} />
                {prevScore !== null && (
                  <span className={`text-[10px] font-medium ${score > prevScore ? 'text-green-400' : score < prevScore ? 'text-red-400' : 'text-zinc-500'}`}>
                    {score > prevScore ? `+${(score - prevScore).toFixed(0)}` : score < prevScore ? `${(score - prevScore).toFixed(0)}` : '±0'}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between mb-1.5">
                <span className="text-white font-bold text-sm">{score}%</span>
                <span className="text-[11px] text-zinc-500">
                  {formatDistanceToNow(new Date(scan.created_date), { addSuffix: true, locale: de })}
                </span>
              </div>

              <HealthBar score={score} />

              {scan.environment_data?.current_stage && (
                <span className="text-[10px] text-zinc-500 mt-1 block">📍 {scan.environment_data.current_stage}</span>
              )}
            </div>

            <div className="flex-shrink-0 self-center">
              {expanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
            </div>
          </div>

          {/* Expanded details */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 pt-0 space-y-3 border-t border-white/[0.05]">
                  {summary && (
                    <p className="text-xs text-zinc-400 leading-relaxed pt-2">{summary}</p>
                  )}

                  {issues.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Probleme</p>
                      <div className="space-y-1">
                        {issues.slice(0, 3).map((issue, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <AlertTriangle className="w-3 h-3 text-orange-400 flex-shrink-0 mt-0.5" />
                            <span className="text-xs text-zinc-400">{issue.description || issue.issue || JSON.stringify(issue)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {actions.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Empfehlungen</p>
                      <div className="space-y-1">
                        {actions.slice(0, 3).map((a, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                            <span className="text-xs text-zinc-400">{a.action || JSON.stringify(a)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-zinc-600">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {format(new Date(scan.created_date), "dd. MMM yyyy, HH:mm 'Uhr'", { locale: de })}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default function PlantPortfolio({ user, isOwnProfile }) {
  const [scans, setScans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only load scans for own profile (PlantScan RLS restricts to created_by anyway)
    if (!user?.email || !isOwnProfile) {
      setScans([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    base44.entities.PlantScan.filter({ created_by: user.email }, '-created_date', 50)
      .then(s => setScans(s || []))
      .catch(() => setScans([]))
      .finally(() => setIsLoading(false));
  }, [user?.email, isOwnProfile]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (scans.length === 0) {
    return (
      <div className="text-center py-16 px-6">
        <div className="w-16 h-16 bg-green-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-green-500/20">
          <Leaf className="w-7 h-7 text-green-400/50" />
        </div>
        <h3 className="text-white font-bold mb-1">Noch kein Pflanzen-Portfolio</h3>
        <p className="text-zinc-500 text-sm">
          {isOwnProfile
            ? 'Scanne deine Pflanze mit dem KI-Scanner, um hier einen Verlauf zu sehen.'
            : 'Dieser Nutzer hat noch keine KI-Scans gespeichert.'}
        </p>
      </div>
    );
  }

  // Stats
  const avgHealth = Math.round(scans.reduce((s, sc) => s + (sc.health_score ?? sc.analysis_result?.health_score ?? 0), 0) / scans.length);
  const latestScore = scans[0]?.health_score ?? scans[0]?.analysis_result?.health_score ?? 0;
  const oldestScore = scans[scans.length - 1]?.health_score ?? scans[scans.length - 1]?.analysis_result?.health_score ?? 0;
  const overallTrend = latestScore - oldestScore;

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="gh-card p-3 text-center">
          <p className="text-2xl font-black text-white">{scans.length}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Scans gesamt</p>
        </div>
        <div className="gh-card p-3 text-center">
          <p className={`text-2xl font-black ${avgHealth >= 70 ? 'text-green-400' : avgHealth >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
            {avgHealth}%
          </p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Ø Gesundheit</p>
        </div>
        <div className="gh-card p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            {overallTrend > 0
              ? <TrendingUp className="w-4 h-4 text-green-400" />
              : overallTrend < 0
              ? <TrendingDown className="w-4 h-4 text-red-400" />
              : <Minus className="w-4 h-4 text-zinc-500" />
            }
            <p className={`text-2xl font-black ${overallTrend > 0 ? 'text-green-400' : overallTrend < 0 ? 'text-red-400' : 'text-zinc-400'}`}>
              {overallTrend > 0 ? '+' : ''}{overallTrend.toFixed(0)}
            </p>
          </div>
          <p className="text-[10px] text-zinc-500 mt-0.5">Gesamt-Trend</p>
        </div>
      </div>

      {/* Health sparkline */}
      <div className="gh-card p-3">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-3.5 h-3.5 text-green-400" />
          <span className="text-xs font-semibold text-zinc-400">Gesundheits-Verlauf</span>
        </div>
        <div className="flex items-end gap-1 h-12">
          {[...scans].reverse().map((sc, i) => {
            const score = sc.health_score ?? sc.analysis_result?.health_score ?? 0;
            const color = score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500';
            return (
              <div
                key={sc.id}
                title={`${score}%`}
                className={`flex-1 rounded-sm ${color} opacity-80 min-w-[4px]`}
                style={{ height: `${Math.max(10, score)}%` }}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-zinc-600">Ältester</span>
          <span className="text-[9px] text-zinc-600">Neuester</span>
        </div>
      </div>

      {/* Timeline */}
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Timeline</p>
        <div>
          {scans.map((scan, i) => (
            <ScanCard
              key={scan.id}
              scan={scan}
              prevScan={scans[i + 1] || null}
              index={i}
              isLast={i === scans.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}