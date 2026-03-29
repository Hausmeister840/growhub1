import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Eye, Heart, Clock } from 'lucide-react';

export default function AdvancedAnalyticsDashboard({ currentUser }) {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    
    const stats = {
      totalViews: Math.floor(Math.random() * 10000),
      avgEngagement: (Math.random() * 10).toFixed(1),
      peakHour: `${Math.floor(Math.random() * 12) + 8}:00`,
      topContent: 'video',
      growthRate: (Math.random() * 50).toFixed(1),
      reachScore: Math.floor(Math.random() * 100)
    };
    
    setAnalytics(stats);
  }, [currentUser]);

  if (!analytics) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 space-y-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-blue-400" />
        <h3 className="text-white font-bold">Deine Analytics</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Eye}
          label="Gesamt-Views"
          value={analytics.totalViews.toLocaleString()}
          color="text-blue-400"
        />
        <StatCard
          icon={Heart}
          label="Ø Engagement"
          value={`${analytics.avgEngagement}%`}
          color="text-red-400"
        />
        <StatCard
          icon={Clock}
          label="Peak Zeit"
          value={analytics.peakHour}
          color="text-purple-400"
        />
        <StatCard
          icon={TrendingUp}
          label="Wachstum"
          value={`+${analytics.growthRate}%`}
          color="text-green-400"
        />
      </div>

      <div className="pt-3 border-t border-white/5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-400">Reach Score</span>
          <span className="text-white font-bold">{analytics.reachScore}/100</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden mt-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${analytics.reachScore}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
          />
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white/5 rounded-2xl p-3">
      <Icon className={`w-4 h-4 ${color} mb-2`} />
      <div className="text-xs text-zinc-500 mb-1">{label}</div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
  );
}