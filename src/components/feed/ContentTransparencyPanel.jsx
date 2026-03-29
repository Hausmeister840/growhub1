import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, Eye, TrendingUp, Users, ChevronDown } from 'lucide-react';

export default function ContentTransparencyPanel({ post, score }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const breakdown = {
    engagement: Math.round((score?.engagement || 0) * 30),
    recency: Math.round((score?.recency || 0) * 25),
    relevance: Math.round((score?.relevance || 0) * 25),
    social: Math.round((score?.social || 0) * 15),
    quality: Math.round((score?.quality || 0) * 5)
  };

  return (
    <div className="border-t border-white/5 mt-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full py-3 flex items-center justify-between text-zinc-500 hover:text-white transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4" />
          <span className="text-xs font-medium">Warum dieser Post?</span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pb-4 space-y-3">
              <div className="space-y-2">
                <ScoreBar
                  label="Engagement"
                  value={breakdown.engagement}
                  icon={TrendingUp}
                  color="from-orange-500 to-red-500"
                />
                <ScoreBar
                  label="Relevanz für dich"
                  value={breakdown.relevance}
                  icon={Eye}
                  color="from-green-500 to-emerald-500"
                />
                <ScoreBar
                  label="Soziale Verbindung"
                  value={breakdown.social}
                  icon={Users}
                  color="from-blue-500 to-purple-500"
                />
                <ScoreBar
                  label="Aktualität"
                  value={breakdown.recency}
                  icon={TrendingUp}
                  color="from-yellow-500 to-orange-500"
                />
              </div>

              <p className="text-xs text-zinc-600 leading-relaxed">
                Dieser Post wurde dir gezeigt, weil er zu {breakdown.relevance}% zu deinen Interessen passt 
                und eine {breakdown.engagement}% Engagement-Rate hat.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ScoreBar({ label, value, icon: Icon, color }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3 h-3 text-zinc-500" />
          <span className="text-xs text-zinc-400">{label}</span>
        </div>
        <span className="text-xs text-white font-medium">{value}%</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full bg-gradient-to-r ${color}`}
        />
      </div>
    </div>
  );
}