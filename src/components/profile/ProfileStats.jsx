import { motion } from 'framer-motion';
import { Users, MessageSquare, Trophy, TrendingUp, Zap } from 'lucide-react';

/**
 * 📊 PROFILE STATS - Quick Overview Cards
 */

export default function ProfileStats({ stats, user, onFollowersClick, onFollowingClick }) {
  const statCards = [
    {
      icon: Users,
      label: 'Follower',
      value: stats?.followers || 0,
      color: 'from-blue-500/20 to-blue-600/20',
      iconColor: 'text-blue-400',
      onClick: onFollowersClick
    },
    {
      icon: Users,
      label: 'Folge ich',
      value: stats?.following || 0,
      color: 'from-purple-500/20 to-purple-600/20',
      iconColor: 'text-purple-400',
      onClick: onFollowingClick
    },
    {
      icon: MessageSquare,
      label: 'Posts',
      value: stats?.posts || 0,
      color: 'from-green-500/20 to-emerald-600/20',
      iconColor: 'text-green-400'
    },
    {
      icon: Zap,
      label: 'XP',
      value: user?.xp || 0,
      color: 'from-yellow-500/20 to-orange-600/20',
      iconColor: 'text-yellow-400'
    },
    {
      icon: Trophy,
      label: 'Achievements',
      value: user?.badges?.length || 0,
      color: 'from-amber-500/20 to-yellow-600/20',
      iconColor: 'text-amber-400'
    },
    {
      icon: TrendingUp,
      label: 'Reputation',
      value: stats?.reputation || user?.reputation_score || 0,
      color: 'from-pink-500/20 to-red-600/20',
      iconColor: 'text-pink-400'
    }
  ];

  return (
    <div className="px-6 mt-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          
          return (
            <motion.button
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={stat.onClick}
              disabled={!stat.onClick}
              className={`glass-card rounded-2xl p-4 border border-zinc-800/50 bg-gradient-to-br ${stat.color} ${
                stat.onClick ? 'hover:scale-105 cursor-pointer' : 'cursor-default'
              } transition-all duration-200 group`}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className={`w-10 h-10 rounded-xl bg-zinc-900/50 flex items-center justify-center ${stat.iconColor} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {stat.value.toLocaleString()}
                  </div>
                  <div className="text-xs text-zinc-400 font-medium">
                    {stat.label}
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}