import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, X } from 'lucide-react';
import { feedOrchestrator } from './FeedOrchestrator';

export default function FeedSystemMonitor({ isOpen, onClose }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      const systemStats = feedOrchestrator.getStats();
      setStats(systemStats);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed top-0 right-0 bottom-0 w-80 bg-zinc-900/95 backdrop-blur-xl border-l border-white/10 z-50 overflow-y-auto"
        >
          <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-zinc-900/95">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-400" />
              <h3 className="text-white font-bold">System Monitor</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl">
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>

          {stats && (
            <div className="p-4 space-y-6">
              {/* Attention Economy */}
              <Section title="Attention Economy">
                <Metric label="Verdiente Tokens" value={stats.attention.totalTokens.toFixed(2)} />
                <Metric label="Posts gesehen" value={stats.attention.postsViewed} />
                <Metric label="Ø Score" value={stats.attention.avgScore.toFixed(1)} />
              </Section>

              {/* Cache Performance */}
              <Section title="Quantum Cache">
                <Metric label="Hit Rate" value={`${(stats.cache.hitRate * 100).toFixed(1)}%`} />
                <Metric label="Cache Größe" value={stats.cache.cacheSize} />
                <Metric label="Predictions" value={stats.cache.predictions} />
              </Section>

              {/* Edge Computing */}
              <Section title="Edge Computing">
                <Metric label="Region" value={stats.edge.region.toUpperCase()} />
                <Metric label="Queue" value={stats.edge.queueLength} />
                <Metric label="Status" value={stats.edge.isProcessing ? 'Aktiv' : 'Idle'} />
              </Section>

              {/* Neural Network */}
              <Section title="Neural Optimizer">
                <Metric label="Engagement Weight" value={`${(stats.neural.weights.engagement * 100).toFixed(0)}%`} />
                <Metric label="Relevance Weight" value={`${(stats.neural.weights.relevance * 100).toFixed(0)}%`} />
                <Metric label="Recency Weight" value={`${(stats.neural.weights.recency * 100).toFixed(0)}%`} />
              </Section>

              {/* Temporal Analysis */}
              <Section title="Temporal Patterns">
                <Metric label="Activity Level" value={`${(stats.temporal.activityLevel * 100).toFixed(0)}%`} />
                <Metric label="Active Windows" value={stats.temporal.engagementWindows.length} />
              </Section>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
      <h4 className="text-white font-semibold text-sm mb-3">{title}</h4>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="text-sm text-white font-medium">{value}</span>
    </div>
  );
}