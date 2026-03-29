import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Heart, 
  MessageCircle, 
  Target,
  Calendar,
  BarChart3
} from 'lucide-react';
import { Post } from '@/entities/Post';
import { Comment } from '@/entities/Comment';

export default function UserInsights({ currentUser, timeRange = 30 }) {
  const [insights, setInsights] = useState({
    engagement: { likes: 0, comments: 0, shares: 0 },
    growth: { followers: 0, posts: 0, streak: 0 },
    performance: { topPost: null, avgLikes: 0, reachGrowth: 0 },
    achievements: []
  });
  const [isLoading, setIsLoading] = useState(true);

  const generateInsights = useCallback(async () => {
    if (!currentUser) {
        setIsLoading(false);
        return;
    };
    
    setIsLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - timeRange);

      // Fetch user's posts in time range
      const allPosts = await Post.filter({ created_by: currentUser.email });
      const recentPosts = allPosts.filter(post => 
        new Date(post.created_date) >= startDate
      );

      // Fetch comments by user
      const userComments = await Comment.filter({ author_email: currentUser.email });
      const recentComments = userComments.filter(comment =>
        new Date(comment.created_date) >= startDate
      );

      // Calculate engagement metrics
      const totalLikes = allPosts.reduce((sum, post) => sum + (post?.likes_count || 0), 0);
      const totalComments = allPosts.reduce((sum, post) => sum + (post?.comments_count || 0), 0);
      const avgLikes = allPosts.length > 0 ? Math.round(totalLikes / allPosts.length) : 0;

      // Find top performing post
      const topPost = allPosts.reduce((top, post) => 
        (post?.likes_count || 0) > (top?.likes_count || 0) ? post : top, null
      );

      // Calculate posting streak
      const postDates = allPosts.map(p => new Date(p.created_date).toDateString());
      const uniqueDates = [...new Set(postDates)].sort().reverse();
      let streak = 0;
      let checkDate = new Date();
      
      for (let date of uniqueDates) {
        if (date === checkDate.toDateString()) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      // Calculate recent achievements
      const recentAchievements = [];
      if (recentPosts.length >= 5) recentAchievements.push('Produktiver Poster');
      if (avgLikes >= 10) recentAchievements.push('Community Liebling');
      if (streak >= 7) recentAchievements.push('Täglicher Poster');
      if (totalComments >= 50) recentAchievements.push('Diskussions-Champion');

      setInsights({
        engagement: {
          likes: totalLikes,
          comments: totalComments,
          shares: 0 // Not implemented yet
        },
        growth: {
          followers: currentUser.followers?.length || 0,
          posts: recentPosts.length,
          streak
        },
        performance: {
          topPost,
          avgLikes,
          reachGrowth: Math.round(((recentPosts.length / Math.max(1, allPosts.length - recentPosts.length)) - 1) * 100)
        },
        achievements: recentAchievements
      });

    } catch (error) {
      console.error('Failed to generate insights:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, timeRange]);

  useEffect(() => {
    generateInsights();
  }, [generateInsights]);

  const getEngagementLevel = () => {
    const score = (insights.engagement?.likes || 0) + ((insights.engagement?.comments || 0) * 2);
    if (score >= 100) return { level: 'Hoch', color: 'text-green-400', progress: 100 };
    if (score >= 50) return { level: 'Mittel', color: 'text-yellow-400', progress: 75 };
    if (score >= 20) return { level: 'Niedrig', color: 'text-orange-400', progress: 50 };
    return { level: 'Neu', color: 'text-gray-400', progress: 25 };
  };

  const engagement = getEngagementLevel();

  if (isLoading) {
    return (
      <Card className="glass-effect">
        <CardContent className="p-6 text-center">
          <BarChart3 className="w-8 h-8 animate-pulse text-green-400 mx-auto mb-4" />
          <p className="text-zinc-300">Analysiere deine Performance...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect border-blue-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Deine Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Engagement Overview */}
          <div>
             <h4 className="text-zinc-300 text-sm font-semibold mb-2">Performance (Letzte {timeRange} Tage)</h4>
             <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Heart className="w-4 h-4 text-red-400" />
                    <span className="text-xl font-bold text-white">{insights.engagement?.likes || 0}</span>
                  </div>
                  <p className="text-xs text-zinc-400">Likes</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <MessageCircle className="w-4 h-4 text-blue-400" />
                    <span className="text-xl font-bold text-white">{insights.engagement?.comments || 0}</span>
                  </div>
                  <p className="text-xs text-zinc-400">Kommentare</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Target className="w-4 h-4 text-green-400" />
                    <span className="text-xl font-bold text-white">{insights.performance?.avgLikes || 0}</span>
                  </div>
                  <p className="text-xs text-zinc-400">⌀ Likes</p>
                </div>
              </div>
          </div>
          
           {/* Growth Metrics */}
          <div>
            <h4 className="text-zinc-300 text-sm font-semibold mb-2">Aktivität & Wachstum</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-xl font-bold text-blue-400">{insights.growth?.followers || 0}</div>
                  <p className="text-xs text-zinc-400">Follower</p>
                </div>
                <div className="space-y-1">
                  <div className="text-xl font-bold text-green-400">{insights.growth?.posts || 0}</div>
                  <p className="text-xs text-zinc-400">Neue Posts</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1">
                    <Calendar className="w-4 h-4 text-orange-400" />
                    <span className="text-xl font-bold text-orange-400">{insights.growth?.streak || 0}</span>
                  </div>
                  <p className="text-xs text-zinc-400">Tage Streak</p>
                </div>
              </div>
          </div>

          {/* Top Post */}
          {insights.performance?.topPost && (
            <div>
                 <h4 className="text-zinc-300 text-sm font-semibold mb-2">🔥 Top Post</h4>
                 <div className="bg-zinc-800/50 p-3 rounded-lg">
                    <p className="text-zinc-300 text-sm mb-2 truncate">
                      "{insights.performance.topPost.content || ''}"
                    </p>
                    <div className="flex gap-4 text-xs text-zinc-400">
                      <span>❤️ {insights.performance.topPost.likes_count || 0}</span>
                      <span>💬 {insights.performance.topPost.comments_count || 0}</span>
                    </div>
                </div>
            </div>
          )}
        </CardContent>
      </Card>
  );
}