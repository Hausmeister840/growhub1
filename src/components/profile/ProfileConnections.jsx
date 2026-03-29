import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, UserCheck, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User } from '@/entities/User';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

/**
 * 👥 PROFILE CONNECTIONS - Followers, Following & Suggestions
 */

export default function ProfileConnections({ userId, stats, currentUser }) {
  const [activeTab, setActiveTab] = useState('followers');
  const [searchQuery, setSearchQuery] = useState('');
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followingActions, setFollowingActions] = useState(new Set());

  const navigate = useNavigate();

  // Load connections
  useEffect(() => {
    loadConnections();
  }, [userId]);

  const loadConnections = async () => {
    setIsLoading(true);
    try {
      const allUsers = await User.list();
      const targetUser = allUsers.find(u => u.id === userId);
      
      if (!targetUser) {
        setFollowers([]);
        setFollowing([]);
        return;
      }

      // Get followers
      const followersList = allUsers.filter(u => 
        u.following?.includes(targetUser.email)
      );
      setFollowers(followersList);

      // Get following
      const followingEmails = targetUser.following || [];
      const followingList = allUsers.filter(u => 
        followingEmails.includes(u.email)
      );
      setFollowing(followingList);

      // Get suggestions (users not followed yet)
      if (currentUser) {
        const currentFollowing = currentUser.following || [];
        const suggestionsList = allUsers
          .filter(u => 
            u.id !== currentUser.id && 
            u.id !== userId &&
            !currentFollowing.includes(u.email)
          )
          .slice(0, 6);
        setSuggestions(suggestionsList);
      }

    } catch (error) {
      console.error('Error loading connections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowToggle = async (targetUser) => {
    if (!currentUser) {
      toast.error('Du musst angemeldet sein');
      return;
    }

    if (followingActions.has(targetUser.email)) return;

    setFollowingActions(prev => new Set([...prev, targetUser.email]));

    try {
      const currentFollowing = currentUser.following || [];
      const isFollowing = currentFollowing.includes(targetUser.email);

      const newFollowing = isFollowing
        ? currentFollowing.filter(e => e !== targetUser.email)
        : [...currentFollowing, targetUser.email];

      await User.update(currentUser.id, { following: newFollowing });

      // Update local state
      if (activeTab === 'following') {
        if (isFollowing) {
          setFollowing(prev => prev.filter(u => u.email !== targetUser.email));
        }
      }

      if (activeTab === 'suggestions') {
        if (!isFollowing) {
          setSuggestions(prev => prev.filter(u => u.email !== targetUser.email));
        }
      }

      toast.success(isFollowing ? 'Nicht mehr gefolgt' : 'Gefolgt!');

    } catch (error) {
      console.error('Follow toggle error:', error);
      toast.error('Fehler beim Folgen/Entfolgen');
    } finally {
      setFollowingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(targetUser.email);
        return newSet;
      });
    }
  };

  const getUserInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    return parts.length === 1 ? parts[0][0] : `${parts[0][0]}${parts[parts.length - 1][0]}`;
  };

  const getCurrentList = () => {
    switch (activeTab) {
      case 'followers':
        return followers;
      case 'following':
        return following;
      case 'suggestions':
        return suggestions;
      default:
        return [];
    }
  };

  const filteredList = getCurrentList().filter(user =>
    !searchQuery ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-zinc-900/50 rounded-xl">
        <button
          onClick={() => setActiveTab('followers')}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'followers'
              ? 'bg-green-600 text-white'
              : 'text-zinc-400 hover:text-zinc-100'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Follower
          <Badge className="ml-2 bg-zinc-800 text-zinc-300">{stats?.followers || 0}</Badge>
        </button>

        <button
          onClick={() => setActiveTab('following')}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'following'
              ? 'bg-green-600 text-white'
              : 'text-zinc-400 hover:text-zinc-100'
          }`}
        >
          <UserCheck className="w-4 h-4 inline mr-2" />
          Folge ich
          <Badge className="ml-2 bg-zinc-800 text-zinc-300">{stats?.following || 0}</Badge>
        </button>

        {currentUser && (
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'suggestions'
                ? 'bg-green-600 text-white'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <UserPlus className="w-4 h-4 inline mr-2" />
            Vorschläge
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <Input
          placeholder={`${activeTab === 'followers' ? 'Follower' : activeTab === 'following' ? 'Following' : 'Nutzer'} suchen...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-zinc-900/50 border-zinc-800"
        />
      </div>

      {/* User List */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 mb-2">
              {searchQuery ? 'Keine Ergebnisse' : 
               activeTab === 'followers' ? 'Noch keine Follower' :
               activeTab === 'following' ? 'Folgt noch niemandem' :
               'Keine Vorschläge verfügbar'}
            </p>
          </div>
        ) : (
          filteredList.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card rounded-2xl p-4 border border-zinc-800/50 hover:border-green-500/30 transition-all"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <button
                  onClick={() => navigate(createPageUrl(`Profile?id=${user.id}`))}
                  className="flex-shrink-0"
                >
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={user.avatar_url} alt={user.full_name} />
                    <AvatarFallback className="bg-green-600 text-white font-bold">
                      {getUserInitials(user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                </button>

                {/* User Info */}
                <button
                  onClick={() => navigate(createPageUrl(`Profile?id=${user.id}`))}
                  className="flex-1 text-left min-w-0"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white truncate">
                      {user.full_name}
                    </h3>
                    {user.verified && (
                      <Badge className="bg-blue-600/20 text-blue-400 text-xs">
                        ✓
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-zinc-500 truncate">
                    @{user.username || user.email}
                  </p>
                  {user.bio && (
                    <p className="text-xs text-zinc-600 line-clamp-1 mt-1">
                      {user.bio}
                    </p>
                  )}
                </button>

                {/* Follow Button */}
                {currentUser && user.id !== currentUser.id && (
                  <Button
                    size="sm"
                    onClick={() => handleFollowToggle(user)}
                    disabled={followingActions.has(user.email)}
                    className={`flex-shrink-0 ${
                      currentUser.following?.includes(user.email)
                        ? 'bg-zinc-800 hover:bg-red-600 text-white border border-zinc-700'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {followingActions.has(user.email) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : currentUser.following?.includes(user.email) ? (
                      <>
                        <UserCheck className="w-4 h-4 mr-1" />
                        Gefolgt
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-1" />
                        Folgen
                      </>
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}