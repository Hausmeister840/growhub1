import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BarChart3, Eye, Heart } from 'lucide-react';

export default function FeedInsights({ currentUser }) {
  const [insights, setInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    loadInsights();
  }, [currentUser]);

  const loadInsights = async () => {
    try {
      const [activities, userPosts] = await Promise.all([
        base44.entities.UserActivity.filter(
          { user_email: currentUser.email },
          '-created_date',
          100
        ),
        base44.entities.Post.filter(
          { created_by: currentUser.email },
          '-created_date',
          50
        )
      ]);

      // Calculate insights
      const topInterests = getTopInterests(activities);
      const engagementRate = calculateEngagementRate(userPosts);
      const mostActiveTime = getMostActiveTime(activities);

      setInsights({
        topInterests,
        engagementRate,
        mostActiveTime,
        totalPosts: userPosts.length,
        totalInteractions: activities.length
      });
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTopInterests = (activities) => {
    const tags = {};
    activities.forEach(act => {
      if (act.metadata?.tags) {
        act.metadata.tags.forEach(tag => {
          tags[tag] = (tags[tag] || 0) + 1;
        });
      }
    });
    return Object.entries(tags)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag]) => tag);
  };

  const calculateEngagementRate = (posts) => {
    if (posts.length === 0) return 0;
    const totalEngagement = posts.reduce((sum, post) => {
      const reactions = Object.values(post.reactions || {})
        .reduce((s, r) => s + (r.count || 0), 0);
      return sum + reactions + (post.comments_count || 0);
    }, 0);
    return Math.round((totalEngagement / posts.length) * 10) / 10;
  };

  const getMostActiveTime = (activities) => {
    const hours = {};
    activities.forEach(act => {
      const hour = new Date(act.created_date).getHours();
      hours[hour] = (hours[hour] || 0) + 1;
    });
    const mostActive = Object.entries(hours)
      .sort((a, b) => b[1] - a[1])[0];
    return mostActive ? `${mostActive[0]}:00` : 'N/A';
  };

  if (!currentUser || isLoading || !insights) return null;

  return (
    <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-purple-500" />
        <h3 className="text-white font-semibold">Deine Insights</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-800/50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-4 h-4 text-blue-400" />
            <p className="text-zinc-400 text-xs">Posts</p>
          </div>
          <p className="text-white font-bold text-xl">{insights.totalPosts}</p>
        </div>

        <div className="bg-zinc-800/50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Heart className="w-4 h-4 text-red-400" />
            <p className="text-zinc-400 text-xs">Ø Engagement</p>
          </div>
          <p className="text-white font-bold text-xl">{insights.engagementRate}</p>
        </div>
      </div>

      {insights.topInterests.length > 0 && (
        <div className="mt-3">
          <p className="text-zinc-400 text-xs mb-2">Top Interessen:</p>
          <div className="flex flex-wrap gap-2">
            {insights.topInterests.map(interest => (
              <span
                key={interest}
                className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-lg"
              >
                #{interest}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-zinc-800">
        <p className="text-zinc-400 text-xs">
          🕐 Meist aktiv: <span className="text-white">{insights.mostActiveTime}</span>
        </p>
      </div>
    </div>
  );
}