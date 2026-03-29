import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, Star, TrendingUp, Target, Award, 
  Zap, Crown, Flame, ChevronRight,
  Lock, Check, Sparkles
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

/**
 * 🎮 ENHANCED GAMIFICATION PANEL
 * Verbesserte XP, Levels, Achievements & Badges
 */

const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000
];

const ACHIEVEMENTS = [
  {
    id: 'first_post',
    title: 'Erster Post',
    description: 'Erstelle deinen ersten Post',
    icon: Star,
    xp: 50,
    rarity: 'common'
  },
  {
    id: 'first_grow',
    title: 'Grow Starter',
    description: 'Starte dein erstes Grow-Tagebuch',
    icon: Flame,
    xp: 100,
    rarity: 'common'
  },
  {
    id: 'social_butterfly',
    title: 'Social Butterfly',
    description: 'Erhalte 100 Reaktionen',
    icon: Sparkles,
    xp: 200,
    rarity: 'rare'
  },
  {
    id: 'grow_master',
    title: 'Grow Master',
    description: 'Schließe 5 Grows erfolgreich ab',
    icon: Crown,
    xp: 500,
    rarity: 'epic'
  },
  {
    id: 'community_hero',
    title: 'Community Hero',
    description: 'Hilf 50 anderen Nutzern',
    icon: Trophy,
    xp: 300,
    rarity: 'rare'
  },
  {
    id: 'streak_champion',
    title: 'Streak Champion',
    description: '30 Tage Streak',
    icon: Zap,
    xp: 1000,
    rarity: 'legendary'
  }
];

const RARITY_COLORS = {
  common: 'border-zinc-600 bg-zinc-900/50',
  rare: 'border-blue-500/30 bg-blue-500/10',
  epic: 'border-purple-500/30 bg-purple-500/10',
  legendary: 'border-amber-500/30 bg-amber-500/10'
};

const RARITY_TEXT = {
  common: 'text-zinc-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-amber-400'
};

export default function EnhancedGamificationPanel({ user, stats }) {
  const xp = user?.xp || 0;
  const badges = user?.badges || [];
  
  // ✅ Berechne Level und Progress
  const { level, currentLevelXP, nextLevelXP, progress } = useMemo(() => {
    let level = 1;
    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
      if (xp >= LEVEL_THRESHOLDS[i]) {
        level = i + 1;
      } else {
        break;
      }
    }
    
    const currentLevelXP = LEVEL_THRESHOLDS[level - 1] || 0;
    const nextLevelXP = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    
    return { level, currentLevelXP, nextLevelXP, progress: Math.min(progress, 100) };
  }, [xp]);

  // ✅ Achievement Status
  const achievementStatus = useMemo(() => {
    return ACHIEVEMENTS.map(achievement => {
      const isUnlocked = badges.includes(achievement.id);
      return { ...achievement, isUnlocked };
    });
  }, [badges]);

  const unlockedCount = achievementStatus.filter(a => a.isUnlocked).length;

  return (
    <div className="space-y-6">
      {/* Level & XP Card */}
      <Card className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50">
              <span className="text-2xl font-bold text-black">{level}</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Level {level}</h3>
              <p className="text-sm text-zinc-400">{xp.toLocaleString()} XP</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-zinc-400">Bis Level {level + 1}</p>
            <p className="text-lg font-bold text-green-400">
              {(nextLevelXP - xp).toLocaleString()} XP
            </p>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-zinc-400 mb-2">
            <span>{xp - currentLevelXP} XP</span>
            <span>{nextLevelXP - currentLevelXP} XP</span>
          </div>
          <Progress value={progress} className="h-3 bg-zinc-800">
            <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500 shadow-lg shadow-green-500/50" />
          </Progress>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 bg-zinc-900/50 border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-400">Reputation</p>
              <p className="text-lg font-bold text-white">{stats?.reputation || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-zinc-900/50 border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-400">Achievements</p>
              <p className="text-lg font-bold text-white">{unlockedCount}/{ACHIEVEMENTS.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Achievements */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Achievements
          </h3>
          <span className="text-sm text-zinc-400">
            {unlockedCount}/{ACHIEVEMENTS.length}
          </span>
        </div>

        <div className="grid gap-3">
          {achievementStatus.map((achievement, index) => {
            const Icon = achievement.icon;
            const isLocked = !achievement.isUnlocked;
            
            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`p-4 border transition-all ${
                  isLocked 
                    ? 'bg-zinc-900/30 border-zinc-800 opacity-60' 
                    : RARITY_COLORS[achievement.rarity]
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isLocked ? 'bg-zinc-800' : 'bg-gradient-to-br from-green-500 to-emerald-500'
                    }`}>
                      {isLocked ? (
                        <Lock className="w-6 h-6 text-zinc-600" />
                      ) : (
                        <Icon className="w-6 h-6 text-black" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-bold ${isLocked ? 'text-zinc-400' : 'text-white'}`}>
                          {achievement.title}
                        </h4>
                        {!isLocked && (
                          <Check className="w-4 h-4 text-green-400" />
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 mb-2">
                        {achievement.description}
                      </p>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold ${RARITY_TEXT[achievement.rarity]}`}>
                          {achievement.rarity.toUpperCase()}
                        </span>
                        <span className="text-xs text-zinc-500">
                          +{achievement.xp} XP
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Next Achievement CTA */}
      {unlockedCount < ACHIEVEMENTS.length && (
        <Card className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-purple-400" />
              <div>
                <p className="text-sm font-bold text-white">Nächstes Ziel</p>
                <p className="text-xs text-zinc-400">
                  {ACHIEVEMENTS.find(a => !badges.includes(a.id))?.title || 'Alle freigeschaltet!'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-purple-400" />
          </div>
        </Card>
      )}
    </div>
  );
}