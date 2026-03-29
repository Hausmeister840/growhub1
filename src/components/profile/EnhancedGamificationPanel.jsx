import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Zap, Star, Crown, Sparkles, TrendingUp, ChevronRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

/**
 * 🎮 ENHANCED GAMIFICATION PANEL - Interactive Achievements & Stats
 */

export default function EnhancedGamificationPanel({ user, stats }) {
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [showAllBadges, setShowAllBadges] = useState(false);

  // Calculate level info
  const getLevelInfo = (xp = 0) => {
    const level = Math.floor(xp / 100) + 1;
    const xpInLevel = xp % 100;
    const xpNeeded = 100;
    const progress = (xpInLevel / xpNeeded) * 100;
    const xpToNextLevel = xpNeeded - xpInLevel;
    
    return { level, xpInLevel, xpNeeded, progress, xpToNextLevel };
  };

  const levelInfo = getLevelInfo(user?.xp || 0);

  // Badge definitions
  const badgeDefinitions = {
    first_post: {
      id: 'first_post',
      name: 'Erste Schritte',
      description: 'Deinen ersten Post erstellt',
      icon: '🌱',
      color: 'from-green-400 to-green-600',
      rarity: 'common'
    },
    ten_posts: {
      id: 'ten_posts',
      name: 'Aktives Mitglied',
      description: '10 Posts erstellt',
      icon: '📝',
      color: 'from-blue-400 to-blue-600',
      rarity: 'common'
    },
    hundred_posts: {
      id: 'hundred_posts',
      name: 'Content Creator',
      description: '100 Posts erstellt',
      icon: '🎬',
      color: 'from-purple-400 to-purple-600',
      rarity: 'rare'
    },
    first_grow: {
      id: 'first_grow',
      name: 'Grower Anfänger',
      description: 'Erstes Grow Tagebuch gestartet',
      icon: '🌿',
      color: 'from-emerald-400 to-emerald-600',
      rarity: 'common'
    },
    completed_grow: {
      id: 'completed_grow',
      name: 'Ernte Erfolg',
      description: 'Ersten Grow abgeschlossen',
      icon: '🏆',
      color: 'from-amber-400 to-amber-600',
      rarity: 'uncommon'
    },
    five_grows: {
      id: 'five_grows',
      name: 'Erfahrener Grower',
      description: '5 Grows abgeschlossen',
      icon: '🌳',
      color: 'from-teal-400 to-teal-600',
      rarity: 'rare'
    },
    hundred_likes: {
      id: 'hundred_likes',
      name: 'Beliebtes Mitglied',
      description: '100 Likes erhalten',
      icon: '❤️',
      color: 'from-pink-400 to-pink-600',
      rarity: 'uncommon'
    },
    fifty_followers: {
      id: 'fifty_followers',
      name: 'Community Influencer',
      description: '50 Follower erreicht',
      icon: '👥',
      color: 'from-indigo-400 to-indigo-600',
      rarity: 'rare'
    },
    hundred_followers: {
      id: 'hundred_followers',
      name: 'Grow Guru',
      description: '100 Follower erreicht',
      icon: '⭐',
      color: 'from-yellow-400 to-yellow-600',
      rarity: 'epic'
    },
    helpful_member: {
      id: 'helpful_member',
      name: 'Hilfsbereites Mitglied',
      description: '50 hilfreiche Kommentare',
      icon: '🤝',
      color: 'from-cyan-400 to-cyan-600',
      rarity: 'uncommon'
    },
    seven_day_streak: {
      id: 'seven_day_streak',
      name: 'Woche Stark',
      description: '7 Tage Streak',
      icon: '🔥',
      color: 'from-orange-400 to-orange-600',
      rarity: 'uncommon'
    },
    thirty_day_streak: {
      id: 'thirty_day_streak',
      name: 'Monats Champion',
      description: '30 Tage Streak',
      icon: '💪',
      color: 'from-red-400 to-red-600',
      rarity: 'epic'
    },
    early_adopter: {
      id: 'early_adopter',
      name: 'Early Adopter',
      description: 'Einer der ersten Nutzer',
      icon: '🚀',
      color: 'from-violet-400 to-violet-600',
      rarity: 'legendary'
    },
    verified: {
      id: 'verified',
      name: 'Verifiziert',
      description: 'Verifiziertes Profil',
      icon: '✓',
      color: 'from-blue-400 to-blue-600',
      rarity: 'rare'
    },
    expert_grower: {
      id: 'expert_grower',
      name: 'Experten Grower',
      description: '10 erfolgreiche Grows',
      icon: '👑',
      color: 'from-gold-400 to-gold-600',
      rarity: 'legendary'
    }
  };

  const userBadges = (user?.badges || []).map(badgeId => badgeDefinitions[badgeId]).filter(Boolean);
  const displayBadges = showAllBadges ? userBadges : userBadges.slice(0, 6);

  const rarityColors = {
    common: 'border-zinc-600 bg-zinc-800/30',
    uncommon: 'border-green-500/30 bg-green-500/10',
    rare: 'border-blue-500/30 bg-blue-500/10',
    epic: 'border-purple-500/30 bg-purple-500/10',
    legendary: 'border-amber-500/30 bg-amber-500/10'
  };

  // Stats calculation
  const growStats = {
    total_grows: stats?.total_grows || 0,
    completed_grows: stats?.completed_grows || 0,
    total_posts: stats?.posts || 0,
    total_followers: stats?.followers || 0,
    reputation: stats?.reputation || 0
  };

  return (
    <div className="space-y-6">
      {/* Level Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-6 border border-zinc-800/50"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">Level {levelInfo.level}</h3>
            <p className="text-sm text-zinc-400">
              {levelInfo.xpInLevel} / {levelInfo.xpNeeded} XP
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-400">{user?.xp || 0}</div>
            <div className="text-xs text-zinc-500">Gesamt XP</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Fortschritt</span>
            <span className="text-green-400 font-medium">{Math.round(levelInfo.progress)}%</span>
          </div>
          <div className="relative h-3 bg-zinc-900 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${levelInfo.progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
            />
          </div>
          <p className="text-xs text-zinc-500 text-center">
            Noch {levelInfo.xpToNextLevel} XP bis Level {levelInfo.level + 1}
          </p>
        </div>
      </motion.div>

      {/* Achievements Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-3xl p-6 border border-zinc-800/50"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h3 className="text-xl font-bold text-white">Erfolge</h3>
          </div>
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            {userBadges.length} / {Object.keys(badgeDefinitions).length}
          </Badge>
        </div>

        {userBadges.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-10 h-10 text-zinc-600" />
            </div>
            <p className="text-zinc-400 mb-2">Noch keine Erfolge freigeschaltet</p>
            <p className="text-sm text-zinc-500">Sei aktiv in der Community, um Badges zu verdienen!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <AnimatePresence>
                {displayBadges.map((badge, index) => (
                  <motion.button
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedBadge(badge)}
                    className={`relative p-4 rounded-2xl border-2 ${rarityColors[badge.rarity]} hover:scale-105 transition-all group`}
                  >
                    <div className="text-center space-y-2">
                      <div className={`text-5xl mb-2 group-hover:scale-110 transition-transform`}>
                        {badge.icon}
                      </div>
                      <h4 className="font-bold text-white text-sm leading-tight">
                        {badge.name}
                      </h4>
                      <p className="text-xs text-zinc-500 line-clamp-2">
                        {badge.description}
                      </p>
                    </div>

                    {/* Rarity indicator */}
                    <div className="absolute top-2 right-2">
                      {badge.rarity === 'legendary' && <Crown className="w-4 h-4 text-amber-400" />}
                      {badge.rarity === 'epic' && <Star className="w-4 h-4 text-purple-400" />}
                      {badge.rarity === 'rare' && <Sparkles className="w-4 h-4 text-blue-400" />}
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>

            {userBadges.length > 6 && (
              <div className="mt-6 text-center">
                <Button
                  variant="ghost"
                  onClick={() => setShowAllBadges(!showAllBadges)}
                  className="text-green-400 hover:text-green-300"
                >
                  {showAllBadges ? 'Weniger anzeigen' : `${userBadges.length - 6} weitere anzeigen`}
                  <ChevronRight className={`w-4 h-4 ml-2 transition-transform ${showAllBadges ? 'rotate-90' : ''}`} />
                </Button>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Grow Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-3xl p-6 border border-zinc-800/50"
      >
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-green-400" />
          <h3 className="text-xl font-bold text-white">Statistiken</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-xl bg-zinc-900/50">
            <div className="text-3xl font-bold text-green-400 mb-1">
              {growStats.total_posts}
            </div>
            <div className="text-xs text-zinc-500">Posts</div>
          </div>

          <div className="text-center p-4 rounded-xl bg-zinc-900/50">
            <div className="text-3xl font-bold text-blue-400 mb-1">
              {growStats.total_followers}
            </div>
            <div className="text-xs text-zinc-500">Follower</div>
          </div>

          <div className="text-center p-4 rounded-xl bg-zinc-900/50">
            <div className="text-3xl font-bold text-purple-400 mb-1">
              {growStats.total_grows}
            </div>
            <div className="text-xs text-zinc-500">Grows</div>
          </div>

          <div className="text-center p-4 rounded-xl bg-zinc-900/50">
            <div className="text-3xl font-bold text-amber-400 mb-1">
              {growStats.reputation}
            </div>
            <div className="text-xs text-zinc-500">Reputation</div>
          </div>
        </div>
      </motion.div>

      {/* Badge Detail Modal */}
      <AnimatePresence>
        {selectedBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedBadge(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`glass-card rounded-3xl p-8 max-w-md w-full border-2 ${rarityColors[selectedBadge.rarity]}`}
            >
              <div className="text-center space-y-4">
                <div className="text-8xl mb-4">
                  {selectedBadge.icon}
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {selectedBadge.name}
                  </h3>
                  <Badge className="mb-4 capitalize">
                    {selectedBadge.rarity}
                  </Badge>
                </div>

                <p className="text-zinc-300 leading-relaxed">
                  {selectedBadge.description}
                </p>

                <Button
                  onClick={() => setSelectedBadge(null)}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Schließen
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}