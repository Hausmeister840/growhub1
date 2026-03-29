import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Edit, MessageCircle, UserPlus, UserMinus, Share2,
  Loader2, Check, MapPin, LinkIcon, Calendar, Flame, Sprout
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { getDisplayName, getInitials } from '@/components/utils/terminology';

export default function ProfileHeader({
  user, stats, isOwnProfile, isFollowing, isFollowLoading,
  onFollow, onMessage, onShare, onEdit, onBlockMute, copiedLink,
  onFollowersClick, onFollowingClick
}) {
  const level = Math.floor((user.xp || 0) / 100) + 1;

  return (
    <div className="relative">
      {/* Banner — shorter, cleaner */}
      <div className="relative h-36 sm:h-44 overflow-hidden">
        {user.banner_url ? (
          <img src={user.banner_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/40 via-black to-emerald-900/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black" />

        {/* Top-right actions on banner */}
        <div className="absolute top-3 right-3 flex gap-2 z-10">
          <button
            onClick={onShare}
            className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            {copiedLink ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
          </button>
          {onBlockMute && (
            <button
              onClick={onBlockMute}
              className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-red-400 transition-colors text-xs font-bold"
            >
              •••
            </button>
          )}
        </div>
      </div>

      {/* Profile info section */}
      <div className="px-4 sm:px-6 -mt-14 relative z-10">
        {/* Avatar + Name row */}
        <div className="flex items-end gap-4">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative flex-shrink-0"
          >
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={getDisplayName(user)}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-[3px] border-black object-cover"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-[3px] border-black bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold">
                {getInitials(user)}
              </div>
            )}

            {/* Level pip */}
            <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-0.5">
              <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-full px-2 py-0.5 text-[10px] font-bold text-black leading-none">
                {level}
              </div>
            </div>
          </motion.div>

          {/* Stats inline */}
          <div className="flex gap-5 sm:gap-7 pb-1 flex-1 justify-center sm:justify-start">
            <StatItem label="Posts" value={stats?.posts || 0} />
            <StatItem label="Follower" value={stats?.followers || 0} onClick={onFollowersClick} />
            <StatItem label="Folge ich" value={stats?.following || 0} onClick={onFollowingClick} />
          </div>
        </div>

        {/* Name & username */}
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white leading-tight">{getDisplayName(user)}</h1>
            {user.verified && (
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
              </div>
            )}
          </div>
          <p className="text-sm text-[var(--gh-text-muted)] mt-0.5">@{user.username || user.email?.split('@')[0]}</p>
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="text-sm text-zinc-300 leading-relaxed mt-2.5 max-w-lg">{user.bio}</p>
        )}

        {/* Meta chips */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5">
          {user.grow_level && (
            <MetaChip icon={<Sprout className="w-3.5 h-3.5 text-green-400" />} text={
              user.grow_level === 'beginner' ? 'Anfänger' :
              user.grow_level === 'intermediate' ? 'Fortgeschritten' :
              user.grow_level === 'expert' ? 'Experte' : 'Meister'
            } />
          )}
          {(user.streak || 0) > 0 && (
            <MetaChip icon={<Flame className="w-3.5 h-3.5 text-orange-400" />} text={`${user.streak} Tage`} />
          )}
          {user.location && (
            <MetaChip icon={<MapPin className="w-3.5 h-3.5 text-blue-400" />} text={user.location} />
          )}
          {user.website_url && (
            <a href={user.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors">
              <LinkIcon className="w-3.5 h-3.5" />
              <span className="truncate max-w-[140px]">{user.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
            </a>
          )}
          {user.created_date && (
            <MetaChip icon={<Calendar className="w-3.5 h-3.5 text-purple-400" />} text={`Seit ${formatDistanceToNow(new Date(user.created_date), { locale: de })}`} />
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          {isOwnProfile ? (
            <Button onClick={onEdit} className="flex-1 bg-[var(--gh-surface-2)] hover:bg-[var(--gh-surface-hover)] text-white border border-white/[0.08] rounded-xl h-9 text-sm font-semibold">
              <Edit className="w-4 h-4 mr-1.5" /> Profil bearbeiten
            </Button>
          ) : (
            <>
              <Button
                onClick={onFollow}
                disabled={isFollowLoading}
                className={`flex-1 rounded-xl h-9 text-sm font-semibold ${
                  isFollowing
                    ? 'bg-[var(--gh-surface-2)] hover:bg-[var(--gh-surface-hover)] text-white border border-white/[0.08]'
                    : 'bg-green-500 hover:bg-green-600 text-black'
                }`}
              >
                {isFollowLoading ? <Loader2 className="w-4 h-4 animate-spin" /> :
                  isFollowing ? <><UserMinus className="w-4 h-4 mr-1" />Entfolgen</> :
                  <><UserPlus className="w-4 h-4 mr-1" />Folgen</>
                }
              </Button>
              <Button onClick={onMessage} className="flex-1 bg-[var(--gh-surface-2)] hover:bg-[var(--gh-surface-hover)] text-white border border-white/[0.08] rounded-xl h-9 text-sm font-semibold">
                <MessageCircle className="w-4 h-4 mr-1.5" /> Nachricht
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value, onClick }) {
  const formatted = value >= 10000 ? `${(value / 1000).toFixed(1)}k` : value.toLocaleString();
  return (
    <button onClick={onClick} disabled={!onClick} className="flex flex-col items-center gap-0">
      <span className="text-lg font-bold text-white leading-tight">{formatted}</span>
      <span className="text-[11px] text-[var(--gh-text-muted)]">{label}</span>
    </button>
  );
}

function MetaChip({ icon, text }) {
  return (
    <span className="flex items-center gap-1 text-xs text-[var(--gh-text-secondary)]">
      {icon}{text}
    </span>
  );
}