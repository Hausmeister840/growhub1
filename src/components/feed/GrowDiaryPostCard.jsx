import { useState } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Calendar, TrendingUp, Sparkles, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AIGrowTips from '../grow/AIGrowTips';

export default function GrowDiaryPostCard({ post, diary, latestEntry }) {
  const navigate = useNavigate();
  const [showAITips, setShowAITips] = useState(false);

  if (!diary) return null;

  const daysSinceStart = diary.start_date 
    ? Math.floor((Date.now() - new Date(diary.start_date).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="space-y-3">
      {/* Diary Info Banner */}
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate(`/GrowDiaryDetail?id=${diary.id}`)}
        className="bg-gradient-to-r from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-2xl p-4 cursor-pointer hover:border-green-500/40 transition-all"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
            <Leaf className="w-5 h-5 text-black" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white truncate">{diary.name}</h4>
            <p className="text-xs text-zinc-400">{diary.strain_name}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-zinc-500" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-2 bg-white/5 rounded-xl">
            <p className="text-xs text-zinc-500 mb-1">Phase</p>
            <p className="text-sm font-semibold text-white truncate">{diary.current_stage}</p>
          </div>
          <div className="p-2 bg-white/5 rounded-xl">
            <div className="flex items-center gap-1 mb-1">
              <Calendar className="w-3 h-3 text-zinc-500" />
              <p className="text-xs text-zinc-500">Tag</p>
            </div>
            <p className="text-sm font-semibold text-white">{daysSinceStart}</p>
          </div>
          <div className="p-2 bg-white/5 rounded-xl">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="w-3 h-3 text-zinc-500" />
              <p className="text-xs text-zinc-500">Score</p>
            </div>
            <p className="text-sm font-semibold text-green-400">
              {diary.ai_insights?.health_score || '--'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* AI Tips Toggle */}
      {latestEntry && (
        <div>
          {!showAITips ? (
            <button
              onClick={() => setShowAITips(true)}
              className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-green-500/30 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-white">KI-Tipps für diesen Eintrag anzeigen</span>
            </button>
          ) : (
            <AIGrowTips entry={latestEntry} diary={diary} compact={true} />
          )}
        </div>
      )}
    </div>
  );
}