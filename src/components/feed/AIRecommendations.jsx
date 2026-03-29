import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Users, BookOpen, ChevronRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AIRecommendations({ recommendations, onDismiss, onInteract }) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);

  if (!visible || !recommendations || recommendations.length === 0) return null;

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  const handleClick = (rec) => {
    onInteract?.(rec);
    if (rec.type === 'user') {
      navigate(`/Profile?userId=${rec.id}`);
    } else if (rec.type === 'tag') {
      navigate(`/Feed?tag=${rec.tag}`);
    } else if (rec.type === 'post') {
      navigate(`/PostThread?id=${rec.id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent border border-green-500/20 rounded-3xl p-6 mb-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-black" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">KI-Empfehlungen</h3>
            <p className="text-sm text-zinc-400">Basierend auf deinen Interessen</p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-2 hover:bg-white/10 rounded-xl transition-colors"
        >
          <X className="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      <div className="space-y-3">
        {recommendations.slice(0, 5).map((rec, idx) => {
          const Icon = rec.type === 'user' ? Users : rec.type === 'tag' ? TrendingUp : BookOpen;
          
          return (
            <motion.button
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => handleClick(rec)}
              className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-green-500/30 rounded-2xl transition-all flex items-center gap-3 group"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/10 rounded-xl flex items-center justify-center group-hover:from-green-500/30 group-hover:to-emerald-500/20 transition-all">
                <Icon className="w-5 h-5 text-green-400" />
              </div>
              
              <div className="flex-1 text-left">
                <p className="text-white font-medium text-sm">{rec.title}</p>
                <p className="text-zinc-500 text-xs">{rec.description}</p>
              </div>

              {rec.score && (
                <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                  <span className="text-xs font-semibold text-green-400">
                    {Math.round(rec.score)}% Match
                  </span>
                </div>
              )}

              <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-green-400 transition-colors" />
            </motion.button>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-xs text-zinc-500 text-center">
          Die KI lernt aus deinen Interaktionen und passt sich an deine Vorlieben an
        </p>
      </div>
    </motion.div>
  );
}