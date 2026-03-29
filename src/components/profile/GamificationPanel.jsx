import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, Trophy, Target, Zap, Lock, Star, TrendingUp, Award,
  Heart, Flame, Users, MessageSquare, Calendar, Eye, BookOpen,
  Gift, Crown, Rocket, Shield, CheckCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { achievementsList } from '@/components/utils/gamification';

// Icon Mapping
const ICON_MAP = {
  Heart, Flame, Users, MessageSquare, Calendar, Eye, BookOpen,
  Gift, Crown, Rocket, Shield, CheckCircle, Trophy, Star, Zap
};

// XP Level System
const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0, title: 'Seedling', icon: '🌱', color: 'from-green-400 to-green-600' },
  { level: 2, xp: 100, title: 'Sprout', icon: '🌿', color: 'from-green-500 to-green-700' },
  { level: 3, xp: 250, title: 'Young Plant', icon: '🪴', color: 'from-lime-500 to-green-700' },
  { level: 4, xp: 500, title: 'Growing', icon: '🌳', color: 'from-emerald-500 to-green-800' },
  { level: 5, xp: 1000, title: 'Cultivator', icon: '🍃', color: 'from-teal-500 to-emerald-700' },
  { level: 6, xp: 2000, title: 'Expert Grower', icon: '🌲', color: 'from-cyan-500 to-teal-700' },
  { level: 7, xp: 4000, title: 'Master', icon: '🏆', color: 'from-blue-500 to-cyan-700' },
  { level: 8, xp: 8000, title: 'Legend', icon: '👑', color: 'from-purple-500 to-blue-700' },
  { level: 9, xp: 16000, title: 'Grow God', icon: '⚡', color: 'from-pink-500 to-purple-700' },
  { level: 10, xp: 32000, title: 'Ultimate', icon: '💎', color: 'from-orange-500 to-pink-700' }
];

const getLevelInfo = (xp) => {
  let currentLevel = LEVEL_THRESHOLDS[0];
  let nextLevel = LEVEL_THRESHOLDS[1];

  for (let i = 0; i < LEVEL_THRESHOLDS.length - 1; i++) {
    if (xp >= LEVEL_THRESHOLDS[i].xp && xp < LEVEL_THRESHOLDS[i + 1].xp) {
      currentLevel = LEVEL_THRESHOLDS[i];
      nextLevel = LEVEL_THRESHOLDS[i + 1];
      break;
    }
  }

  if (xp >= LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1].xp) {
    currentLevel = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    nextLevel = null;
  }

  const xpInLevel = xp - currentLevel.xp;
  const xpForNextLevel = nextLevel ? nextLevel.xp - currentLevel.xp : 0;
  const progress = nextLevel ? (xpInLevel / xpForNextLevel) * 100 : 100;

  return { currentLevel, nextLevel, xpInLevel, xpForNextLevel, progress };
};

export default function GamificationPanel({ user }) {
  const [hoveredBadge, setHoveredBadge] = useState(null);
  
  const xp = user?.xp || 0;
  const badges = user?.badges || [];
  const { currentLevel, nextLevel, xpInLevel, xpForNextLevel, progress } = getLevelInfo(xp);

  // Get achievements
  const unlockedAchievements = achievementsList.filter(a => badges.includes(a.id));
  const lockedAchievements = achievementsList.filter(a => !badges.includes(a.id));

  return (
    <div className="space-y-6">
      {/* Level & XP Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-6 border border-zinc-800/50 relative overflow-hidden"
      >
        {/* Background Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${currentLevel.color} opacity-10`} />
        
        <div className="relative z-10">
          {/* Current Level */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center text-4xl border border-green-500/30">
                {currentLevel.icon}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl font-bold text-white">Level {currentLevel.level}</span>
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                </div>
                <p className="text-lg font-semibold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  {currentLevel.title}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">{xp.toLocaleString()}</div>
              <p className="text-sm text-zinc-400">Total XP</p>
            </div>
          </div>

          {/* Progress to Next Level */}
          {nextLevel && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">
                  {xpInLevel.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP
                </span>
                <span className="text-green-400 font-semibold">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="relative h-3 bg-zinc-800/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                />
              </div>
              <p className="text-xs text-zinc-500 text-right">
                {(xpForNextLevel - xpInLevel).toLocaleString()} XP bis Level {nextLevel.level}
              </p>
            </div>
          )}

          {/* Max Level Reached */}
          {!nextLevel && (
            <div className="text-center py-4">
              <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
              <p className="text-lg font-bold text-yellow-400">Maximales Level erreicht! 🎉</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Achievements & Badges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-3xl p-6 border border-zinc-800/50"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-yellow-400" />
            Achievements
          </h3>
          <Badge variant="outline" className="text-green-400 border-green-500/30">
            {unlockedAchievements.length} / {achievementsList.length}
          </Badge>
        </div>

        {/* Unlocked Achievements */}
        {unlockedAchievements.length > 0 && (
          <div className="mb-6">
            <p className="text-sm text-zinc-400 mb-3 font-semibold">Freigeschaltet</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {unlockedAchievements.map((achievement) => {
                const IconComponent = ICON_MAP[achievement.icon] || Trophy;
                
                return (
                  <motion.div
                    key={achievement.id}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onHoverStart={() => setHoveredBadge(achievement.id)}
                    onHoverEnd={() => setHoveredBadge(null)}
                    className="relative group"
                  >
                    <div className="glass-card rounded-2xl p-4 border border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/5 text-center cursor-pointer">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-2 border border-green-500/30">
                        <IconComponent className="w-6 h-6 text-green-400" />
                      </div>
                      <p className="text-xs font-semibold text-white line-clamp-1">
                        {achievement.name}
                      </p>
                    </div>

                    {/* Tooltip */}
                    {hoveredBadge === achievement.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 w-48"
                      >
                        <div className="glass-card rounded-xl p-3 border border-green-500/30 bg-zinc-900/95 backdrop-blur-xl">
                          <p className="text-sm font-bold text-white mb-1">{achievement.name}</p>
                          <p className="text-xs text-zinc-400">{achievement.description}</p>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Locked Achievements */}
        {lockedAchievements.length > 0 && (
          <div>
            <p className="text-sm text-zinc-400 mb-3 font-semibold">Noch nicht freigeschaltet</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {lockedAchievements.slice(0, 8).map((achievement) => {
                return (
                  <motion.div
                    key={achievement.id}
                    whileHover={{ scale: 1.02 }}
                    onHoverStart={() => setHoveredBadge(achievement.id)}
                    onHoverEnd={() => setHoveredBadge(null)}
                    className="relative group"
                  >
                    <div className="glass-card rounded-2xl p-4 border border-zinc-800/50 text-center cursor-pointer opacity-50 hover:opacity-70 transition-opacity">
                      <div className="w-12 h-12 rounded-xl bg-zinc-800/50 flex items-center justify-center mx-auto mb-2">
                        <Lock className="w-5 h-5 text-zinc-600" />
                      </div>
                      <p className="text-xs font-semibold text-zinc-600 line-clamp-1">
                        ???
                      </p>
                    </div>

                    {/* Tooltip */}
                    {hoveredBadge === achievement.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 w-48"
                      >
                        <div className="glass-card rounded-xl p-3 border border-zinc-800 bg-zinc-900/95 backdrop-blur-xl">
                          <p className="text-sm font-bold text-zinc-400 mb-1">{achievement.name}</p>
                          <p className="text-xs text-zinc-500">{achievement.description}</p>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="glass-card rounded-2xl p-4 border border-zinc-800/50 text-center">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-2">
            <Target className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">{user?.posts_count || 0}</p>
          <p className="text-xs text-zinc-400">Posts</p>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-zinc-800/50 text-center">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-2">
            <Zap className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white">{user?.total_reactions_received || 0}</p>
          <p className="text-xs text-zinc-400">Reactions</p>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-zinc-800/50 text-center">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-5 h-5 text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-white">{user?.reputation_score || 0}</p>
          <p className="text-xs text-zinc-400">Reputation</p>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-zinc-800/50 text-center">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-2">
            <Star className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white">{badges.length}</p>
          <p className="text-xs text-zinc-400">Badges</p>
        </div>
      </motion.div>
    </div>
  );
}