import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Bug, Beaker, Leaf, BarChart3, Shield, Zap
} from 'lucide-react';

import HealthTrendChart from './HealthTrendChart';
import IssueOverview from './IssueOverview';
import ScanToGrowPlan from './ScanToGrowPlan';

const TABS = [
  { id: 'overview', label: 'Übersicht', icon: Activity },
  { id: 'trends', label: 'Trends', icon: BarChart3 },
  { id: 'issues', label: 'Probleme', icon: Bug },
  { id: 'actions', label: 'Grow-Plan', icon: Zap },
];

function StatCard({ label, value, sub, icon: Icon, color = 'green' }) {
  const colors = {
    green: 'from-green-500/10 to-green-500/5 border-green-500/20 text-green-400',
    red: 'from-red-500/10 to-red-500/5 border-red-500/20 text-red-400',
    yellow: 'from-yellow-500/10 to-yellow-500/5 border-yellow-500/20 text-yellow-400',
    blue: 'from-blue-500/10 to-blue-500/5 border-blue-500/20 text-blue-400',
    purple: 'from-purple-500/10 to-purple-500/5 border-purple-500/20 text-purple-400',
  };

  return (
    <div className={`p-3.5 rounded-2xl border bg-gradient-to-br ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 opacity-70" />}
        <span className="text-[11px] font-semibold uppercase tracking-wider opacity-70">{label}</span>
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      {sub && <p className="text-[11px] text-zinc-500 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function ScanDashboard({ scans, linkedDiary, onRefreshDiary }) {
  const [activeTab, setActiveTab] = useState('overview');

  // Derived analytics
  const analytics = useMemo(() => {
    if (!scans?.length) return null;

    const sorted = [...scans].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    const latest = sorted[sorted.length - 1];
    const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null;

    const scores = sorted.map(s => s.health_score).filter(s => typeof s === 'number');
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const latestScore = latest?.health_score ?? 0;
    const delta = previous?.health_score != null ? latestScore - previous.health_score : null;

    // Aggregate all issues across scans
    const allIssues = [];
    const issueFrequency = {};
    scans.forEach(scan => {
      const risks = scan.risk_factors || scan.analysis_result?.risk_factors || [];
      risks.forEach(r => {
        const title = typeof r === 'string' ? r : r.title || 'Unbekannt';
        const severity = typeof r === 'string' ? 'medium' : r.severity || 'medium';
        allIssues.push({ title, severity, scan_date: scan.created_date, scan_id: scan.id });
        issueFrequency[title] = (issueFrequency[title] || 0) + 1;
      });
    });

    // All action items from latest scan
    const latestActions = latest?.action_plan || latest?.analysis_result?.action_plan || [];
    const latestRisks = latest?.risk_factors || latest?.analysis_result?.risk_factors || [];

    // Recurring issues (appeared > 1 time)
    const recurring = Object.entries(issueFrequency)
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .map(([title, count]) => ({ title, count }));

    // Categories breakdown
    const pestCount = allIssues.filter(i => /schädling|pest|insekt|milbe|thrip|blattlaus/i.test(i.title)).length;
    const nutrientCount = allIssues.filter(i => /nährstoff|mangel|überschuss|defiz|chlor|stickstoff|kalium|phosphor|eisen|magnesium/i.test(i.title)).length;
    const envCount = allIssues.filter(i => /temperatur|feuchtigkeit|licht|stress|klima|vpd/i.test(i.title)).length;

    return {
      totalScans: scans.length,
      latestScore,
      avgScore,
      delta,
      latest,
      sorted,
      allIssues,
      latestActions,
      latestRisks,
      recurring,
      pestCount,
      nutrientCount,
      envCount,
      scores,
    };
  }, [scans]);

  if (!analytics || !scans?.length) {
    return (
      <div className="text-center py-16 px-6">
        <Shield className="w-14 h-14 text-zinc-700 mx-auto mb-4" />
        <p className="text-white font-bold text-lg mb-1">Noch kein Dashboard</p>
        <p className="text-zinc-500 text-sm">Starte deinen ersten Scan, um das KI-Dashboard freizuschalten.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

      {/* Hero Score Card */}
      <div className="bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent border border-white/[0.10] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Aktueller Health Score</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-4xl font-black ${
                analytics.latestScore >= 75 ? 'text-green-400' :
                analytics.latestScore >= 50 ? 'text-yellow-400' : 'text-red-400'
              }`}>{analytics.latestScore}</span>
              <span className="text-zinc-600 text-sm font-medium">/100</span>
              {analytics.delta != null && analytics.delta !== 0 && (
                <span className={`text-sm font-bold flex items-center gap-0.5 ${
                  analytics.delta > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {analytics.delta > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {analytics.delta > 0 ? '+' : ''}{analytics.delta}
                </span>
              )}
            </div>
          </div>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            analytics.latestScore >= 75 ? 'bg-green-500/15' :
            analytics.latestScore >= 50 ? 'bg-yellow-500/15' : 'bg-red-500/15'
          }`}>
            {analytics.latestScore >= 75 ? <CheckCircle className="w-7 h-7 text-green-400" /> :
             analytics.latestScore >= 50 ? <AlertTriangle className="w-7 h-7 text-yellow-400" /> :
             <AlertTriangle className="w-7 h-7 text-red-400" />}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2">
          <StatCard label="Scans" value={analytics.totalScans} icon={Activity} color="blue" />
          <StatCard label="Ø Score" value={analytics.avgScore} icon={BarChart3} color="purple" />
          <StatCard label="Probleme" value={analytics.allIssues.length} icon={AlertTriangle}
            color={analytics.allIssues.length === 0 ? 'green' : analytics.allIssues.length > 5 ? 'red' : 'yellow'} />
          <StatCard label="Schädlinge" value={analytics.pestCount} icon={Bug}
            color={analytics.pestCount === 0 ? 'green' : 'red'} />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-green-500 text-black'
                : 'bg-white/[0.04] text-zinc-400 border border-white/[0.06] hover:text-white'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            {tab.id === 'issues' && analytics.latestRisks.length > 0 && (
              <span className={`ml-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                activeTab === tab.id ? 'bg-black/20 text-black' : 'bg-red-500/20 text-red-400'
              }`}>{analytics.latestRisks.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {/* Issue category breakdown */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                <Bug className="w-5 h-5 text-red-400 mx-auto mb-1" />
                <p className="text-lg font-black text-white">{analytics.pestCount}</p>
                <p className="text-[10px] text-zinc-500">Schädlinge</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                <Beaker className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                <p className="text-lg font-black text-white">{analytics.nutrientCount}</p>
                <p className="text-[10px] text-zinc-500">Nährstoffprobleme</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                <Leaf className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <p className="text-lg font-black text-white">{analytics.envCount}</p>
                <p className="text-[10px] text-zinc-500">Umgebungsstress</p>
              </div>
            </div>

            {/* Recurring issues warning */}
            {analytics.recurring.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/[0.06] border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-amber-300">Wiederkehrende Probleme</span>
                </div>
                <div className="space-y-1.5">
                  {analytics.recurring.slice(0, 4).map((r, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs text-zinc-300">{r.title}</span>
                      <span className="text-xs font-bold text-amber-400">{r.count}× erkannt</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mini trend preview */}
            {analytics.scores.length > 1 && (
              <HealthTrendChart scans={analytics.sorted} compact />
            )}
          </motion.div>
        )}

        {activeTab === 'trends' && (
          <motion.div key="tr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <HealthTrendChart scans={analytics.sorted} />
          </motion.div>
        )}

        {activeTab === 'issues' && (
          <motion.div key="is" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <IssueOverview
              latestRisks={analytics.latestRisks}
              allIssues={analytics.allIssues}
              recurring={analytics.recurring}
            />
          </motion.div>
        )}

        {activeTab === 'actions' && (
          <motion.div key="ac" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ScanToGrowPlan
              latestScan={analytics.latest}
              linkedDiary={linkedDiary}
              onRefreshDiary={onRefreshDiary}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}