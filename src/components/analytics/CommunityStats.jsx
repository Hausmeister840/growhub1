import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  MessageCircle,
  TrendingUp,
  Activity,
  RefreshCw,
  AlertCircle,
  Brain,
  Eye,
  Heart
} from 'lucide-react';
import { Post } from '@/entities/Post';
import { User } from '@/entities/User';
import { Comment } from '@/entities/Comment';
import { motion } from 'framer-motion';

export default function CommunityStats({ currentUser }) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    totalReactions: 0,
    avgEngagement: 0,
    topContributors: [],
    growthRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // ✅ FIXED: Removed unnecessary currentUser dependency
  const loadCommunityStats = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      // Get basic counts with fallbacks
      const [users, posts, comments] = await Promise.all([
        User.list().catch(() => []),
        Post.filter({ visibility: 'public' }).catch(() => []),
        Comment.list().catch(() => [])
      ]);

      // Calculate enhanced stats
      const totalUsers = Array.isArray(users) ? users.length : 0;
      const totalPosts = Array.isArray(posts) ? posts.length : 0;
      const totalComments = Array.isArray(comments) ? comments.length : 0;

      // Calculate total reactions from posts
      let totalReactions = 0;
      if (Array.isArray(posts)) {
        posts.forEach(post => {
          if (post.reactions && typeof post.reactions === 'object') {
            Object.values(post.reactions).forEach(reaction => {
              if (reaction && typeof reaction.count === 'number') {
                totalReactions += reaction.count;
              }
            });
          }
        });
      }

      // Calculate active users (users with posts/comments in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      let activeUsers = 0;
      if (Array.isArray(users)) {
        activeUsers = users.filter(user => {
          if (!user.last_online_at) return false;
          try {
            return new Date(user.last_online_at) > thirtyDaysAgo;
          } catch {
            return false;
          }
        }).length;
      }

      // Calculate engagement rate
      const avgEngagement = totalPosts > 0 ? 
        ((totalReactions + totalComments) / totalPosts * 100) : 0;

      // Find top contributors
      const userContributions = {};
      if (Array.isArray(posts)) {
        posts.forEach(post => {
          const author = post.created_by;
          if (!userContributions[author]) {
            userContributions[author] = { posts: 0, reactions: 0 };
          }
          userContributions[author].posts++;
          
          if (post.reactions) {
            Object.values(post.reactions).forEach(reaction => {
              if (reaction && typeof reaction.count === 'number') {
                userContributions[author].reactions += reaction.count;
              }
            });
          }
        });
      }

      const topContributors = Object.entries(userContributions)
        .map(([email, data]) => ({
          email,
          score: data.posts * 3 + data.reactions
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      // Mock growth rate (in real app, compare with previous period)
      const growthRate = Math.floor(Math.random() * 20) + 5;

      setStats({
        totalUsers,
        activeUsers,
        totalPosts,
        totalComments,
        totalReactions,
        avgEngagement: Math.round(avgEngagement),
        topContributors,
        growthRate
      });

    } catch (error) {
      console.error('Failed to load community stats:', error);
      setHasError(true);
      
      // Fallback mock stats
      setStats({
        totalUsers: 156,
        activeUsers: 89,
        totalPosts: 423,
        totalComments: 1247,
        totalReactions: 2843,
        avgEngagement: 78,
        topContributors: [
          { email: 'grower@example.com', score: 234 },
          { email: 'expert@example.com', score: 189 }
        ],
        growthRate: 12
      });
    } finally {
      setIsLoading(false);
    }
  }, []); // ✅ FIXED: Removed currentUser from dependencies

  useEffect(() => {
    loadCommunityStats();
    // Refresh every 10 minutes
    const interval = setInterval(loadCommunityStats, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadCommunityStats]); // ✅ FIXED: Added dependency

  // ✅ MEMOIZED STAT ITEMS to prevent unnecessary re-renders
  const statItems = useMemo(() => [
    {
      label: 'Community Mitglieder',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      change: `+${stats.growthRate}%`
    },
    {
      label: 'Aktive Nutzer (30d)',
      value: stats.activeUsers,
      icon: Activity,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      change: `${Math.round((stats.activeUsers / Math.max(stats.totalUsers, 1)) * 100)}%`
    },
    {
      label: 'Community Posts',
      value: stats.totalPosts,
      icon: MessageCircle,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      change: 'Gesamt'
    },
    {
      label: 'Engagement Rate',
      value: `${stats.avgEngagement}%`,
      icon: Heart,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      change: 'Durchschnitt'
    }
  ], [stats]);

  if (hasError) {
    return (
      <Card className="glass-effect border-red-500/30">
        <CardContent className="p-4 text-center">
          <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
          <p className="text-red-400 text-sm mb-3">Community Stats laden fehlgeschlagen</p>
          <Button
            onClick={loadCommunityStats}
            variant="outline"
            size="sm"
            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Erneut versuchen
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect border-blue-500/20">
      <CardHeader className="bg-gray-950 pb-2 p-6 flex flex-col space-y-1.5">
        <CardTitle className="text-white flex items-center gap-2 text-lg">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Community Insights
          {isLoading && <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="bg-gray-950 pt-0 p-6 space-y-4">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {statItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-3 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <span className="text-zinc-300 text-xs font-medium">{item.label}</span>
              </div>
              <div className="flex items-center justify-between">
                {isLoading ? (
                  <div className="w-12 h-5 bg-zinc-700 animate-pulse rounded" />
                ) : (
                  <>
                    <span className="text-white text-lg font-bold">{item.value}</span>
                    <Badge className={`text-xs ${item.bgColor} ${item.color} border-none`}>
                      {item.change}
                    </Badge>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Engagement Indicator */}
        <div className="mt-4 p-3 rounded-lg bg-zinc-800/20">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-zinc-400">Community Health</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span className="text-blue-400 font-medium">
                {stats.avgEngagement > 60 ? 'Sehr aktiv' :
                 stats.avgEngagement > 30 ? 'Aktiv' : 'Wachsend'}
              </span>
            </div>
          </div>
          
          {/* Simple Progress Indicator */}
          <div className="w-full bg-zinc-700 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-green-400 transition-all duration-500 ease-out"
              style={{ width: `${Math.min(stats.avgEngagement, 100)}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-zinc-500 mt-1">
            <span>0%</span>
            <span className="font-medium text-zinc-400">{stats.avgEngagement}% Engagement</span>
            <span>100%</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2 border-t border-zinc-800">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10"
            onClick={() => window.dispatchEvent(new CustomEvent('openCreatePost'))}
          >
            <Brain className="w-4 h-4 mr-1" />
            Beitrag
          </Button>
          
          <Button
            variant="ghost" 
            size="sm"
            className="flex-1 text-zinc-400 hover:text-purple-400 hover:bg-purple-500/10"
            onClick={loadCommunityStats}
          >
            <Eye className="w-4 h-4 mr-1" />
            Aktualisieren
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}