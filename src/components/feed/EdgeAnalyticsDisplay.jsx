import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap, Globe, Clock } from 'lucide-react';
import { edgeComputing } from './EdgeComputingSimulator';

export default function EdgeAnalyticsDisplay() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(edgeComputing.getMetrics());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!metrics) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-cyan-400" />
        <h3 className="text-white font-semibold text-sm">Edge Computing</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={Zap}
          label="Latenz"
          value="<50ms"
          color="text-green-400"
        />
        <MetricCard
          icon={Globe}
          label="Region"
          value={metrics.region.toUpperCase()}
          color="text-blue-400"
        />
        <MetricCard
          icon={Activity}
          label="Cache"
          value={metrics.cacheSize}
          color="text-purple-400"
        />
        <MetricCard
          icon={Clock}
          label="Queue"
          value={metrics.queueLength}
          color="text-orange-400"
        />
      </div>

      <div className="mt-3 pt-3 border-t border-white/5">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>Processing Status</span>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${
              metrics.isProcessing ? 'bg-green-500 animate-pulse' : 'bg-zinc-700'
            }`} />
            <span>{metrics.isProcessing ? 'Aktiv' : 'Idle'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MetricCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white/5 rounded-xl p-3">
      <Icon className={`w-3.5 h-3.5 ${color} mb-1`} />
      <div className="text-[10px] text-zinc-500 mb-0.5">{label}</div>
      <div className={`text-sm font-bold ${color}`}>{value}</div>
    </div>
  );
}