import { useState, useEffect } from 'react';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ChatHeader({ conversation, currentUser, allUsers, onBack, onSettingsClick }) {
  const { type, name, avatar, participants } = conversation;
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(false);

  const otherParticipant = type === 'direct'
    ? allUsers.find(u => participants?.includes(u.id) && u.id !== currentUser?.id)
    : null;

  const displayName = type === 'direct'
    ? (otherParticipant?.full_name || otherParticipant?.username || otherParticipant?.email?.split('@')[0] || 'Unbekannt')
    : (name || 'Gruppe');
  const displayAvatar = type === 'direct' ? otherParticipant?.avatar_url : avatar;
  const memberCount = type !== 'direct' ? (participants?.length || 0) : null;

  useEffect(() => {
    if (!otherParticipant) return;
    const check = () => {
      const lastSeen = otherParticipant.last_seen;
      setIsOnline(lastSeen && (Date.now() - new Date(lastSeen).getTime()) < 5 * 60 * 1000);
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [otherParticipant]);

  let subtitle;
  if (type !== 'direct') {
    const memberNames = (participants || [])
      .filter(id => id !== currentUser?.id)
      .map(id => allUsers.find(u => u.id === id))
      .filter(Boolean)
      .map(u => u.full_name || u.username || 'Nutzer')
      .slice(0, 3);
    subtitle = memberNames.length > 0
      ? `${memberNames.join(', ')}${participants.length > 4 ? ` +${participants.length - 4}` : ''}`
      : `${memberCount} Mitglieder`;
  } else if (isOnline) {
    subtitle = 'Online';
  } else if (otherParticipant?.last_seen) {
    const lastSeen = new Date(otherParticipant.last_seen);
    const diffMin = Math.floor((Date.now() - lastSeen.getTime()) / 60000);
    if (diffMin < 60) subtitle = `vor ${diffMin} Min. online`;
    else if (diffMin < 1440) subtitle = `vor ${Math.floor(diffMin / 60)} Std. online`;
    else subtitle = `Zuletzt ${lastSeen.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}`;
  } else if (otherParticipant?.username) {
    subtitle = `@${otherParticipant.username}`;
  }

  const handleAvatarClick = () => {
    if (otherParticipant?.id) navigate(`/Profile?id=${otherParticipant.id}`);
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl flex-shrink-0 shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
      <button onClick={onBack} className="p-2 -ml-1 text-zinc-400 hover:text-white active:scale-95 transition-all rounded-xl">
        <ArrowLeft className="w-5 h-5" />
      </button>

      <button onClick={handleAvatarClick} className="relative flex-shrink-0 focus:outline-none">
        {displayAvatar ? (
          <img src={displayAvatar} alt={displayName} className="w-10 h-10 rounded-xl object-cover ring-[1.5px] ring-white/[0.08]" />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">{displayName?.[0]?.toUpperCase() || '?'}</span>
          </div>
        )}
        {isOnline && type === 'direct' && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0a]" />
        )}
      </button>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={handleAvatarClick}>
        <p className="text-[15px] font-semibold text-white truncate">{displayName}</p>
        {subtitle && (
          <p className={`text-xs truncate ${isOnline ? 'text-green-400' : 'text-[var(--gh-text-muted)]'}`}>
            {subtitle}
          </p>
        )}
      </div>

      <button
        onClick={() => onSettingsClick?.()}
        className="p-2 text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
    </div>
  );
}