import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function SmartRecommendations({ currentUser }) {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState(new Set());

  useEffect(() => {
    if (!currentUser) return;
    loadRecommendations();
  }, [currentUser]);

  const loadRecommendations = async () => {
    try {
      // Get user's activity for profiling
      const [activities, follows, allUsers] = await Promise.all([
        base44.entities.UserActivity.filter(
          { user_email: currentUser.email },
          '-created_date',
          50
        ),
        base44.entities.Follow.filter({ follower_email: currentUser.email }),
        base44.entities.User.list('-created_date', 100)
      ]);

      const currentFollowIds = new Set(follows.map(f => f.followee_id));
      setFollowingIds(currentFollowIds);

      // Build interest profile
      const interests = {};
      activities.forEach(act => {
        if (act.metadata?.tags) {
          act.metadata.tags.forEach(tag => {
            interests[tag] = (interests[tag] || 0) + 1;
          });
        }
      });

      // Score users based on content relevance
      const scored = allUsers
        .filter(u => u.id !== currentUser.id && !currentFollowIds.has(u.id))
        .map(user => ({
          ...user,
          score: calculateUserRelevance(user, interests, activities)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      setRecommendations(scored);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateUserRelevance = (user, interests, activities) => {
    let score = 0;

    // Score based on user's interests matching
    const topInterests = Object.keys(interests).slice(0, 5);
    topInterests.forEach(interest => {
      if (user.bio?.toLowerCase().includes(interest.toLowerCase())) {
        score += 10;
      }
    });

    // Score based on activity in similar content
    const interactedAuthors = new Set(
      activities
        .filter(a => a.metadata?.author_email)
        .map(a => a.metadata.author_email)
    );
    if (interactedAuthors.size > 0) {
      score += 5;
    }

    // Boost verified users
    if (user.verified) score += 3;

    // Boost users with profile info
    if (user.bio) score += 2;
    if (user.avatar_url) score += 2;

    return score;
  };

  const handleFollow = async (userId) => {
    try {
      const response = await base44.functions.invoke('profile/toggleFollow', {
        targetUserId: userId
      });

      if (response.data.following) {
        setFollowingIds(prev => new Set([...prev, userId]));
        toast.success('Folge ich jetzt');
      }
    } catch (error) {
      toast.error('Fehler beim Folgen');
    }
  };

  if (!currentUser || isLoading || recommendations.length === 0) return null;

  return (
    <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-green-500" />
        <h3 className="text-white font-semibold">Empfehlungen für dich</h3>
      </div>

      <div className="space-y-3">
        {recommendations.map((user) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <img
              src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
              alt={user.username}
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-white font-medium text-sm truncate">
                  {user.full_name || user.username}
                </p>
                {user.verified && <span className="text-blue-500">✓</span>}
              </div>
              <p className="text-zinc-400 text-xs truncate">@{user.username}</p>
            </div>
            <button
              onClick={() => handleFollow(user.id)}
              disabled={followingIds.has(user.id)}
              className="px-4 py-1.5 bg-green-500 hover:bg-green-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium rounded-full transition-colors"
            >
              {followingIds.has(user.id) ? 'Folge ich' : 'Folgen'}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}