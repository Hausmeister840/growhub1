import { memo, useRef, useState, useCallback } from 'react';
import { Check, CheckCheck, Pin, VolumeX, Users, Trash2, PinOff, Volume2 } from 'lucide-react';
import { updateConversation as updateConvBackend } from '@/functions/chat/updateConversation';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const ConversationItem = memo(function ConversationItem({
  conversation, isSelected, currentUser, allUsers, onClick
}) {
  const { id: convId, type, name, avatar, participants, lastMessage, unreadCount, isPinned, isMuted } = conversation;
  const [swipeX, setSwipeX] = useState(0);
  const [showSwipeActions, setShowSwipeActions] = useState(false);
  const startXRef = useRef(0);
  const swipingRef = useRef(false);

  const otherParticipant = type === 'direct'
    ? allUsers.find(u => participants?.includes(u.id) && u.id !== currentUser?.id)
    : null;

  const displayName = type === 'direct'
    ? (otherParticipant?.full_name || otherParticipant?.username || otherParticipant?.email?.split('@')[0] || 'Unbekannter Nutzer')
    : (name || 'Gruppe');
  const displayAvatar = type === 'direct' ? otherParticipant?.avatar_url : avatar;
  const myUnread = unreadCount?.[currentUser?.id] || 0;
  const myIsPinned = isPinned?.[currentUser?.id] || false;
  const myIsMuted = isMuted?.[currentUser?.id] || false;
  const hasUnread = myUnread > 0;

  const isOnline = (() => {
    if (type !== 'direct' || !otherParticipant) return false;
    const lastSeen = otherParticipant.last_seen;
    return lastSeen && (Date.now() - new Date(lastSeen).getTime()) < 5 * 60 * 1000;
  })();

  const getPreview = () => {
    if (!lastMessage) return 'Tippe, um zu chatten';
    const prefix = type !== 'direct' && lastMessage.senderId !== currentUser?.id
      ? `${lastMessage.senderName || 'Jemand'}: ` : '';
    switch (lastMessage.type) {
      case 'image': return `${prefix}📷 Foto`;
      case 'video': return `${prefix}🎬 Video`;
      case 'voice': return `${prefix}🎤 Sprachnachricht`;
      case 'sticker': return `${prefix}${lastMessage.content || '🏷'}`;
      default: return `${prefix}${lastMessage.content || ''}`;
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const diff = Date.now() - d.getTime();
    if (diff < 86400000) return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return d.toLocaleDateString('de-DE', { weekday: 'short' });
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  };

  // Swipe handlers
  const onTouchStart = useCallback((e) => {
    startXRef.current = e.touches[0].clientX;
    swipingRef.current = false;
  }, []);

  const onTouchMove = useCallback((e) => {
    const dx = e.touches[0].clientX - startXRef.current;
    if (dx > 0) return; // Only left swipe
    if (Math.abs(dx) < 10 && !swipingRef.current) return;
    swipingRef.current = true;
    setSwipeX(Math.max(-120, dx));
  }, []);

  const onTouchEnd = useCallback(() => {
    if (swipeX < -60) {
      setSwipeX(-120);
      setShowSwipeActions(true);
    } else {
      setSwipeX(0);
      setShowSwipeActions(false);
    }
    swipingRef.current = false;
  }, [swipeX]);

  const resetSwipe = () => {
    setSwipeX(0);
    setShowSwipeActions(false);
  };

  const handlePin = async () => {
    const newPinned = { ...(isPinned || {}), [currentUser.id]: !myIsPinned };
    updateConvBackend({ conversationId: convId, data: { isPinned: newPinned } }).catch(() => {});
    toast.success(myIsPinned ? 'Losgelöst' : 'Angepinnt');
    resetSwipe();
  };

  const handleMute = async () => {
    const newMuted = { ...(isMuted || {}), [currentUser.id]: !myIsMuted };
    updateConvBackend({ conversationId: convId, data: { isMuted: newMuted } }).catch(() => {});
    toast.success(myIsMuted ? 'Ton an' : 'Stummgeschaltet');
    resetSwipe();
  };

  const handleDelete = async () => {
    try {
      await base44.entities.Conversation.delete(convId);
      toast.success('Chat gelöscht');
    } catch {
      toast.error('Fehler beim Löschen');
    }
    resetSwipe();
  };

  const handleClick = () => {
    if (swipingRef.current || showSwipeActions) {
      resetSwipe();
      return;
    }
    onClick();
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Swipe action buttons behind */}
      <div className="absolute inset-y-0 right-0 flex items-stretch">
        <button onClick={handlePin} className="w-[40px] flex items-center justify-center bg-blue-600 text-white">
          {myIsPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
        </button>
        <button onClick={handleMute} className="w-[40px] flex items-center justify-center bg-yellow-600 text-white">
          {myIsMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
        <button onClick={handleDelete} className="w-[40px] flex items-center justify-center bg-red-600 text-white">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div
        className={`relative flex items-center gap-3.5 px-3.5 py-3.5 transition-all duration-200 text-left group ${
          isSelected
            ? 'bg-gradient-to-r from-green-500/15 to-emerald-500/5 border border-green-500/25 rounded-2xl shadow-lg shadow-green-900/10'
            : hasUnread
              ? 'bg-zinc-900/70 hover:bg-zinc-800/70 border border-zinc-700/40 rounded-2xl'
              : 'bg-zinc-950/30 hover:bg-zinc-900/55 border border-transparent rounded-2xl'
        }`}
        style={{ transform: `translateX(${swipeX}px)`, transition: swipingRef.current ? 'none' : 'transform 0.2s ease-out' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={handleClick}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {displayAvatar ? (
            <img src={displayAvatar} alt={displayName}
              className={`w-[52px] h-[52px] rounded-2xl object-cover transition-all ${isSelected ? 'ring-2 ring-green-500/35' : 'ring-[1.5px] ring-white/[0.08]'}`} />
          ) : (
            <div className={`w-[52px] h-[52px] rounded-2xl flex items-center justify-center transition-all ${
              type === 'direct' ? 'bg-gradient-to-br from-green-500/80 to-emerald-600/80' : 'bg-gradient-to-br from-purple-500/80 to-violet-600/80'
            } ${isSelected ? 'ring-2 ring-green-500/30' : ''}`}>
              {type === 'direct' ? (
                <span className="text-white font-bold text-lg">{displayName?.[0]?.toUpperCase() || '?'}</span>
              ) : (
                <Users className="w-5 h-5 text-white" />
              )}
            </div>
          )}
          {isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-[2.5px] border-black shadow-sm shadow-green-500/50" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={`text-[14px] font-semibold truncate transition-colors ${
                hasUnread ? 'text-white' : isSelected ? 'text-green-300' : 'text-zinc-200 group-hover:text-white'
              }`}>
                {displayName}
              </span>
              {myIsPinned && <Pin className="w-3 h-3 text-zinc-600 flex-shrink-0 rotate-45" />}
              {myIsMuted && <VolumeX className="w-3 h-3 text-zinc-600 flex-shrink-0" />}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {lastMessage?.senderId === currentUser?.id && (
                lastMessage.status === 'read'
                  ? <CheckCheck className="w-3.5 h-3.5 text-green-400" />
                  : lastMessage.status === 'delivered'
                    ? <CheckCheck className="w-3.5 h-3.5 text-zinc-500" />
                    : <Check className="w-3.5 h-3.5 text-zinc-500" />
              )}
              <span className={`text-[11px] font-medium ${hasUnread ? 'text-green-400' : 'text-zinc-500'}`}>
                {formatTime(lastMessage?.timestamp)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className={`text-[13px] truncate leading-tight ${hasUnread ? 'text-zinc-300 font-medium' : 'text-zinc-500'}`}>
              {getPreview()}
            </p>
            {hasUnread && (
              <span className="flex-shrink-0 min-w-[20px] h-[20px] px-1.5 bg-green-500 text-black text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-sm shadow-green-500/30">
                {myUnread > 99 ? '99+' : myUnread}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default ConversationItem;