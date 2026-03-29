import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, UserMinus, Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const LEVEL_INFO = {
  beginner: { label: 'Beginner', icon: '🌱', color: 'text-green-400' },
  intermediate: { label: 'Advanced', icon: '🧪', color: 'text-blue-400' },
  advanced: { label: 'Master', icon: '🔥', color: 'text-orange-400' },
  expert: { label: 'Leader', icon: '👑', color: 'text-yellow-400' },
};

export default function UserCard({ user, currentUser, index = 0 }) {
  const [isFollowing, setIsFollowing] = useState(
    currentUser?.following?.includes(user.email) || false
  );
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const isOwn = currentUser?.id === user.id;
  const level = LEVEL_INFO[user.grow_level] || LEVEL_INFO.beginner;

  const handleFollow = useCallback(async (e) => {
    e.stopPropagation();
    if (!currentUser || isOwn || loading) return;

    const was = isFollowing;
    setIsFollowing(!was);
    setLoading(true);

    try {
      const currentFollowing = currentUser.following || [];
      const updated = was
        ? currentFollowing.filter(e => e !== user.email)
        : [...currentFollowing, user.email];

      await base44.entities.User.update(currentUser.id, { following: updated });
      currentUser.following = updated;
      toast.success(was ? 'Entfolgt' : 'Gefolgt!');
    } catch {
      setIsFollowing(was);
      toast.error('Fehler');
    } finally {
      setLoading(false);
    }
  }, [currentUser, user, isFollowing, isOwn, loading]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => navigate(createPageUrl(`Profile?id=${user.id}`))}
      className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/50 hover:bg-zinc-800/60 transition-colors cursor-pointer"
    >
      {user.avatar_url ? (
        <img src={user.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold flex-shrink-0">
          {user.full_name?.[0] || '?'}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-white text-sm truncate">{user.full_name || user.username || user.email?.split('@')[0] || 'Grower'}</p>
          <span className="text-xs" title={level.label}>{level.icon}</span>
        </div>
        <p className="text-xs text-zinc-500 truncate">@{user.username || user.email?.split('@')[0]}</p>
        {user.bio && <p className="text-xs text-zinc-400 truncate mt-0.5">{user.bio}</p>}
        <div className="flex items-center gap-3 mt-1 text-[10px] text-zinc-500">
          {user.location && (
            <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{user.location}</span>
          )}
          {user.followers_count > 0 && (
            <span>{user.followers_count} Follower</span>
          )}
        </div>
      </div>

      {!isOwn && currentUser && (
        <Button
          size="sm"
          onClick={handleFollow}
          disabled={loading}
          className={`rounded-full text-xs px-3 h-8 flex-shrink-0 ${
            isFollowing
              ? 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : isFollowing ? (
            <><UserMinus className="w-3 h-3 mr-1" />Gefolgt</>
          ) : (
            <><UserPlus className="w-3 h-3 mr-1" />Folgen</>
          )}
        </Button>
      )}
    </motion.div>
  );
}