import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, TrendingUp, Gift, Sparkles } from 'lucide-react';
import { attentionTracker } from './AttentionEconomyTracker';

export default function TokenRewardDisplay({ currentUser }) {
  const [tokens, setTokens] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [recentEarned, setRecentEarned] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const stats = attentionTracker.getStats();
      const newTokens = stats.totalTokens;
      
      if (newTokens > tokens) {
        const earned = newTokens - tokens;
        setRecentEarned(earned);
        setShowReward(true);
        setTimeout(() => setShowReward(false), 3000);
      }
      
      setTokens(newTokens);
    }, 2000);

    return () => clearInterval(interval);
  }, [tokens]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-3xl p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-400" />
            <span className="text-white font-semibold">GHT Balance</span>
          </div>
          <Gift className="w-4 h-4 text-yellow-400" />
        </div>

        <div className="text-center">
          <motion.div
            key={tokens}
            initial={{ scale: 1.2, color: '#FCD34D' }}
            animate={{ scale: 1, color: '#FFFFFF' }}
            className="text-4xl font-bold text-white mb-1"
          >
            {tokens.toFixed(2)}
          </motion.div>
          <p className="text-xs text-zinc-500">GrowHub Tokens</p>
        </div>

        <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-3 text-xs">
          <div className="text-center">
            <TrendingUp className="w-3.5 h-3.5 text-green-400 mx-auto mb-1" />
            <div className="text-zinc-500">Heute verdient</div>
            <div className="text-white font-semibold">+{(tokens * 0.3).toFixed(2)}</div>
          </div>
          <div className="text-center">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 mx-auto mb-1" />
            <div className="text-zinc-500">Level</div>
            <div className="text-white font-semibold">{Math.floor(tokens / 10)}</div>
          </div>
        </div>
      </motion.div>

      {/* Floating reward notification */}
      <AnimatePresence>
        {showReward && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className="fixed top-24 left-1/2 z-50 bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-6 py-3 rounded-2xl font-bold shadow-2xl shadow-yellow-500/50 flex items-center gap-2"
          >
            <Coins className="w-5 h-5" />
            +{recentEarned.toFixed(2)} GHT
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}