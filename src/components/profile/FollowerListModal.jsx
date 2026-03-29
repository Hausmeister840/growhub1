import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Users, UserPlus, UserMinus, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { fetchUsersByIds } from '@/api/userDirectory';

/**
 * 👥 FOLLOWER/FOLLOWING LIST MODAL
 */

export default function FollowerListModal({ userId, type = 'followers', isOpen, onClose, currentUser }) {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [followingStates, setFollowingStates] = useState({});

  useEffect(() => {
    if (!isOpen || !userId) return;

    const loadUsers = async () => {
      setIsLoading(true);
      try {
        const relationQuery = type === 'followers'
          ? { followee_id: userId, status: 'active' }
          : { follower_id: userId, status: 'active' };
        const relations = await base44.entities.Follow.filter(relationQuery, '-created_date', 300);
        const ids = [...new Set((relations || []).map((row) =>
          type === 'followers' ? row.follower_id : row.followee_id
        ).filter(Boolean))];
        const userObjects = ids.length > 0 ? await fetchUsersByIds(ids) : [];

        setUsers(userObjects);
        setFilteredUsers(userObjects);

        // Set following states
        if (currentUser) {
          const myRelations = await base44.entities.Follow.filter({
            follower_id: currentUser.id,
            status: 'active'
          }, '-created_date', 500);
          const myFollowingIds = new Set((myRelations || []).map((row) => row.followee_id));
          const states = {};
          userObjects.forEach(u => {
            states[u.id] = myFollowingIds.has(u.id);
          });
          setFollowingStates(states);
        }

      } catch (error) {
        console.error('Load users error:', error);
        toast.error('Fehler beim Laden');
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, [isOpen, userId, type, currentUser]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(u =>
      u.full_name?.toLowerCase().includes(query) ||
      u.username?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const handleFollow = async (user) => {
    if (!currentUser) {
      toast.error('Bitte melde dich an');
      return;
    }

    if (user.id === currentUser.id) return;

    const wasFollowing = followingStates[user.id];

    // Optimistic update
    setFollowingStates(prev => ({
      ...prev,
      [user.id]: !wasFollowing
    }));

    try {
      await base44.functions.invoke('toggleFollow', { 
        targetUserId: user.id 
      });

      toast.success(wasFollowing ? 'Nicht mehr gefolgt' : 'Gefolgt!');
    } catch (error) {
      console.error('Follow error:', error);
      
      // Rollback
      setFollowingStates(prev => ({
        ...prev,
        [user.id]: wasFollowing
      }));
      
      toast.error('Aktion fehlgeschlagen');
    }
  };

  if (!isOpen) return null;

  const getUserInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    return parts.length > 1 
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : parts[0][0].toUpperCase();
  };

  const getUserColor = (email) => {
    if (!email) return '#10B981';
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center px-4 bg-black/80 backdrop-blur-xl"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-lg max-h-[80vh] bg-gradient-to-br from-zinc-900/95 via-zinc-900/98 to-black/95 backdrop-blur-2xl rounded-3xl border border-zinc-800/50 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-green-500" />
            {type === 'followers' ? 'Follower' : 'Folge ich'}
            <span className="text-zinc-500 text-sm">({filteredUsers.length})</span>
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="px-6 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Suchen..."
              className="pl-10 bg-zinc-900/50 border-zinc-800"
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500">
                {searchQuery ? 'Keine Ergebnisse' : 'Noch keine Benutzer'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map(user => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors"
                >
                  <Link
                    to={createPageUrl(`Profile?id=${user.id}`)}
                    onClick={onClose}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{ background: getUserColor(user.email) }}
                    >
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        getUserInitials(user.full_name || user.username)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">
                        {user.full_name || user.username || 'User'}
                      </p>
                      <p className="text-sm text-zinc-500 truncate">
                        @{user.username || user.email}
                      </p>
                    </div>
                  </Link>

                  {currentUser && user.id !== currentUser.id && (
                    <Button
                      onClick={() => handleFollow(user)}
                      variant={followingStates[user.id] ? 'outline' : 'default'}
                      size="sm"
                      className={followingStates[user.id] 
                        ? 'border-zinc-700' 
                        : 'bg-green-600 hover:bg-green-700'
                      }
                    >
                      {followingStates[user.id] ? (
                        <>
                          <UserMinus className="w-4 h-4 mr-1" />
                          Entfolgen
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-1" />
                          Folgen
                        </>
                      )}
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}