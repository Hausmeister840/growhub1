import { useState, useEffect } from 'react';
import { UserPlus, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function SuggestedUsers({ currentUser, limit = 5 }) {
  const [suggestions, setSuggestions] = useState([]);
  const [following, setFollowing] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuggestions();
  }, [currentUser]);

  const loadSuggestions = async () => {
    if (!currentUser) return;

    try {
      const allUsers = await base44.entities.User.list();
      
      const currentFollowing = new Set(currentUser.following || []);
      
      // Filter out current user and already following
      const candidates = allUsers
        .filter(u => 
          u.email !== currentUser.email && 
          !currentFollowing.has(u.email)
        )
        .map(u => ({
          ...u,
          score: calculateScore(u, currentUser)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      setSuggestions(candidates);
      setFollowing(currentFollowing);
    } catch (error) {
      console.error('Load suggestions error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateScore = (user, currentUser) => {
    let score = 0;
    
    // More followers = more interesting
    score += (user.followers_count || 0) * 2;
    
    // More posts = more active
    score += (user.posts_count || 0);
    
    // Has avatar = more engaged
    if (user.avatar_url) score += 10;
    
    // Random factor for diversity
    score += Math.random() * 20;
    
    return score;
  };

  const handleFollow = async (userEmail) => {
    try {
      const newFollowing = new Set(following);
      newFollowing.add(userEmail);
      setFollowing(newFollowing);

      await base44.entities.User.update(currentUser.id, {
        following: Array.from(newFollowing)
      });

      toast.success('Gefolgt!');
    } catch (error) {
      console.error('Follow error:', error);
      toast.error('Fehler beim Folgen');
      loadSuggestions();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
      <h3 className="text-lg font-bold text-white mb-4">Vorgeschlagene User</h3>
      <div className="space-y-4">
        {suggestions.map(user => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <Link to={createPageUrl(`Profile?id=${user.email}`)} className="flex-1 flex items-center gap-3 min-w-0">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                  {user.full_name?.[0] || '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{user.full_name}</p>
                <p className="text-zinc-400 text-xs truncate">@{user.username || user.email.split('@')[0]}</p>
              </div>
            </Link>
            
            <Button
              onClick={() => handleFollow(user.email)}
              disabled={following.has(user.email)}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <UserPlus className="w-4 h-4" />
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}