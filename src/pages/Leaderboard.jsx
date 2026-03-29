import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  Trophy, Medal, Crown, Star, Users,
  Sprout, MessageCircle, Loader2, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const CATEGORIES = [
  { id: 'xp', label: 'XP', icon: Star, color: 'yellow' },
  { id: 'posts', label: 'Posts', icon: MessageCircle, color: 'blue' },
  { id: 'grows', label: 'Grows', icon: Sprout, color: 'green' },
  { id: 'followers', label: 'Follower', icon: Users, color: 'purple' }
];

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState('xp');
  const [timeframe, setTimeframe] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allUsers, user] = await Promise.all([
        base44.entities.User.list('-created_date', 200),
        base44.auth.me().catch(() => null)
      ]);
      
      setUsers(allUsers || []);
      setCurrentUser(user);
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSortedUsers = () => {
    return [...users].sort((a, b) => {
      switch (category) {
        case 'xp':
          return (b.xp || 0) - (a.xp || 0);
        case 'posts':
          return (b.posts_count || 0) - (a.posts_count || 0);
        case 'grows':
          return (b.grows_count || 0) - (a.grows_count || 0);
        case 'followers':
          return (b.followers_count || (b.followers?.length || 0)) - (a.followers_count || (a.followers?.length || 0));
        default:
          return 0;
      }
    });
  };

  const getValue = (user) => {
    switch (category) {
      case 'xp': return user.xp || 0;
      case 'posts': return user.posts_count || 0;
      case 'grows': return user.grows_count || 0;
      case 'followers': return user.followers_count || (user.followers?.length || 0);
      default: return 0;
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-zinc-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="text-zinc-500 font-bold">{rank}</span>;
  };

  const sortedUsers = getSortedUsers();
  const currentUserRank = currentUser ? sortedUsers.findIndex(u => u.id === currentUser.id) + 1 : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
          <p className="text-zinc-500 text-sm">Lade Rangliste...</p>
        </div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-zinc-900 rounded-full flex items-center justify-center">
            <Trophy className="w-10 h-10 text-zinc-600" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">Keine Ranglisten-Daten</h3>
          <p className="text-zinc-400 mb-2">
            Die Community baut sich gerade auf! Werde aktiv und erscheine bald hier.
          </p>
          <p className="text-sm text-zinc-500 mb-6">
            💪 Poste Inhalte • 🌱 Starte Grows • 🤝 Folge anderen
          </p>
          <Button
            onClick={() => navigate(createPageUrl('Feed'))}
            className="bg-green-600 hover:bg-green-700"
          >
            Zur Community
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <div className="sticky top-14 lg:top-0 z-20 bg-gradient-to-b from-yellow-500/20 to-black border-b border-zinc-800">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
              <p className="text-sm text-zinc-400">Die besten der Community</p>
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  category === cat.id
                    ? cat.id === 'xp' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                    : cat.id === 'posts' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                    : cat.id === 'grows' ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                    : 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <cat.icon className="w-4 h-4" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Your Rank */}
      {currentUser && currentUserRank > 0 && (
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="p-4 bg-gradient-to-r from-green-500/20 to-emerald-600/20 rounded-2xl border border-green-500/30">
            <p className="text-xs text-green-400 mb-2">Dein Rang</p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-green-400">#{currentUserRank}</span>
              </div>
              <div className="flex-1">
                <p className="text-white font-bold">{currentUser.full_name || currentUser.username}</p>
                <p className="text-sm text-zinc-400">{getValue(currentUser).toLocaleString()} {CATEGORIES.find(c => c.id === category)?.label}</p>
              </div>
              {currentUserRank <= 10 && (
                <div className="px-3 py-1 bg-yellow-500/20 rounded-full">
                  <span className="text-yellow-400 text-sm font-bold">Top 10</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-end justify-center gap-4 mb-8">
          {/* 2nd Place */}
          {sortedUsers[1] && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onClick={() => navigate(createPageUrl(`Profile?id=${sortedUsers[1].id}`))}
              className="flex flex-col items-center"
            >
              <div className="relative mb-2">
                {sortedUsers[1].avatar_url ? (
                  <img src={sortedUsers[1].avatar_url} alt="" className="w-16 h-16 rounded-full border-4 border-zinc-400" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-zinc-700 flex items-center justify-center border-4 border-zinc-400 text-white font-bold text-xl">
                    {sortedUsers[1].full_name?.[0] || '?'}
                  </div>
                )}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-zinc-400 rounded-full flex items-center justify-center">
                  <span className="text-black font-bold">2</span>
                </div>
              </div>
              <div className="w-20 h-16 bg-zinc-400/20 rounded-t-lg flex flex-col items-center justify-center">
                <p className="text-white text-xs font-medium truncate max-w-full px-1">{sortedUsers[1].username || sortedUsers[1].full_name?.split(' ')[0]}</p>
                <p className="text-zinc-400 text-xs">{getValue(sortedUsers[1]).toLocaleString()}</p>
              </div>
            </motion.button>
          )}

          {/* 1st Place */}
          {sortedUsers[0] && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => navigate(createPageUrl(`Profile?id=${sortedUsers[0].id}`))}
              className="flex flex-col items-center"
            >
              <Crown className="w-8 h-8 text-yellow-500 mb-1" />
              <div className="relative mb-2">
                {sortedUsers[0].avatar_url ? (
                  <img src={sortedUsers[0].avatar_url} alt="" className="w-20 h-20 rounded-full border-4 border-yellow-500" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center border-4 border-yellow-500 text-white font-bold text-2xl">
                    {sortedUsers[0].full_name?.[0] || '?'}
                  </div>
                )}
              </div>
              <div className="w-24 h-24 bg-yellow-500/20 rounded-t-lg flex flex-col items-center justify-center">
                <p className="text-white text-sm font-bold truncate max-w-full px-1">{sortedUsers[0].username || sortedUsers[0].full_name?.split(' ')[0]}</p>
                <p className="text-yellow-400 text-sm font-bold">{getValue(sortedUsers[0]).toLocaleString()}</p>
              </div>
            </motion.button>
          )}

          {/* 3rd Place */}
          {sortedUsers[2] && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={() => navigate(createPageUrl(`Profile?id=${sortedUsers[2].id}`))}
              className="flex flex-col items-center"
            >
              <div className="relative mb-2">
                {sortedUsers[2].avatar_url ? (
                  <img src={sortedUsers[2].avatar_url} alt="" className="w-14 h-14 rounded-full border-4 border-amber-600" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-amber-600/20 flex items-center justify-center border-4 border-amber-600 text-white font-bold text-lg">
                    {sortedUsers[2].full_name?.[0] || '?'}
                  </div>
                )}
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-amber-600 rounded-full flex items-center justify-center">
                  <span className="text-black font-bold text-sm">3</span>
                </div>
              </div>
              <div className="w-16 h-12 bg-amber-600/20 rounded-t-lg flex flex-col items-center justify-center">
                <p className="text-white text-xs font-medium truncate max-w-full px-1">{sortedUsers[2].username || sortedUsers[2].full_name?.split(' ')[0]}</p>
                <p className="text-amber-400 text-xs">{getValue(sortedUsers[2]).toLocaleString()}</p>
              </div>
            </motion.button>
          )}
        </div>

        {/* Rest of Leaderboard */}
        <div className="space-y-2">
          {sortedUsers.slice(3, 50).map((user, idx) => (
            <motion.button
              key={user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (idx + 3) * 0.02 }}
              onClick={() => navigate(createPageUrl(`Profile?id=${user.id}`))}
              className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
                user.id === currentUser?.id
                  ? 'bg-green-500/10 border border-green-500/30'
                  : 'bg-zinc-900/50 hover:bg-zinc-900'
              }`}
            >
              <div className="w-8 text-center">
                <span className="text-zinc-500 font-bold">{idx + 4}</span>
              </div>
              
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-12 h-12 rounded-full" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold">
                  {user.full_name?.[0] || '?'}
                </div>
              )}
              
              <div className="flex-1 text-left">
                <p className="text-white font-semibold">{user.full_name || user.username}</p>
                <p className="text-sm text-zinc-400">@{user.username || user.email?.split('@')[0]}</p>
              </div>
              
              <div className="text-right">
                <p className="text-white font-bold">{getValue(user).toLocaleString()}</p>
                <p className="text-xs text-zinc-500">{CATEGORIES.find(c => c.id === category)?.label}</p>
              </div>
              
              <ChevronRight className="w-5 h-5 text-zinc-600" />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}