import { useState, memo } from 'react';
import { Check, CheckCheck, Reply, Smile, Mic, AlertCircle, RefreshCw, Forward, Trash2, Copy } from 'lucide-react';
import ReactionPicker from './ReactionPicker';
import SwipeableMessage from './SwipeableMessage';
import { toast } from 'sonner';

const MessageBubble = memo(function MessageBubble({ 
  message, isOwn, showAvatar, showName, currentUser,
  onReply, onReact, onRetry, onMediaClick, onDelete, onForward, highlight
}) {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  if (!message) return null;

  const { id: msgId, content, type, media, reactions, replyTo, status, created_date, isEdited, senderName, senderAvatar, forwardedFrom } = message;

  const formatTime = (ts) => new Date(ts).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

  const getStatusIcon = () => {
    if (!isOwn) return null;
    switch (status) {
      case 'sending': return <div className="w-3 h-3 border border-gray-400 rounded-full animate-spin border-t-transparent" />;
      case 'sent': return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered': return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read': return <CheckCheck className="w-3 h-3 text-green-400" />;
      case 'failed': return <AlertCircle className="w-3 h-3 text-red-400" />;
      default: return null;
    }
  };

  const handleCopy = () => {
    if (content) { navigator.clipboard.writeText(content); toast.success('Kopiert'); }
  };

  const renderContent = () => {
    if (type === 'sticker') return <div className="text-7xl">{content}</div>;

    if (type === 'image' && media?.url) {
      return (
        <div className="max-w-xs">
          <img src={media.url} alt="Bild" className="rounded-lg max-w-full cursor-pointer hover:opacity-90 transition-opacity" style={{ maxHeight: 300 }}
            onClick={() => onMediaClick?.({ url: media.url, type: 'image' })}
            onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
          {content && content !== '📷 Foto' && <p className="mt-2 text-sm">{content}</p>}
        </div>
      );
    }

    if (type === 'video' && media?.url) {
      return (
        <div className="max-w-xs">
          <div className="relative cursor-pointer group" onClick={() => onMediaClick?.({ url: media.url, type: 'video' })}>
            <video src={media.url} className="rounded-lg max-w-full pointer-events-none" style={{ maxHeight: 300 }} preload="metadata" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors rounded-lg flex items-center justify-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <div className="w-0 h-0 border-l-[20px] border-l-white border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-1" />
              </div>
            </div>
          </div>
          {content && content !== '🎬 Video' && <p className="mt-2 text-sm">{content}</p>}
        </div>
      );
    }

    if (type === 'voice' && media?.url) {
      return (
        <div className="flex items-center gap-3 min-w-[200px]">
          <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center"><Mic className="w-4 h-4 text-green-400" /></div>
          <audio src={media.url} controls className="flex-1" style={{ height: '32px' }} preload="metadata" />
          {media.duration && <span className="text-xs text-gray-400">{Math.floor(media.duration / 60)}:{String(media.duration % 60).padStart(2, '0')}</span>}
        </div>
      );
    }

    return <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{content}</p>;
  };

  const bubble = (
    <div 
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1.5 ${highlight ? 'bg-yellow-500/10 rounded-xl -mx-2 px-2 py-1 transition-colors duration-1000' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowReactions(false); }}
    >
      {!isOwn && (
        <div className="w-9 flex-shrink-0 mr-2">
          {showAvatar ? (
            senderAvatar ? (
              <img src={senderAvatar} alt={senderName || 'User'} className="w-9 h-9 rounded-full object-cover ring-2 ring-zinc-800" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center ring-2 ring-zinc-800">
                <span className="text-white font-semibold text-sm">{(senderName?.[0] || '?').toUpperCase()}</span>
              </div>
            )
          ) : null}
        </div>
      )}

      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[80%]`}>
        {showName && !isOwn && <p className="text-xs text-green-400 mb-1 ml-3 font-medium">{senderName || 'Unbekannt'}</p>}

        {/* Forwarded indicator */}
        {forwardedFrom && (
          <div className="flex items-center gap-1 mb-1 ml-3">
            <Forward className="w-3 h-3 text-zinc-500" />
            <span className="text-[11px] text-zinc-500">Weitergeleitet</span>
          </div>
        )}

        {replyTo && (
          <div className={`mb-1.5 px-3 py-2 rounded-xl text-xs border-l-4 border-green-500 ${isOwn ? 'bg-green-900/20' : 'bg-zinc-800/80'}`}>
            <p className="text-green-400 font-semibold text-xs mb-0.5">{replyTo.senderName}</p>
            <p className="text-gray-300 text-xs line-clamp-1">{replyTo.content}</p>
          </div>
        )}

        <div className="relative group">
          <div className={`
            ${type === 'sticker' ? '' : 'px-4 py-2.5 rounded-2xl shadow-lg border'}
            ${type === 'sticker' ? '' : isOwn ? 'bg-gradient-to-br from-green-600 to-emerald-600 text-white shadow-green-900/20 border-green-500/30 rounded-br-sm' : 'bg-zinc-800/95 text-white border-zinc-700/70 rounded-bl-sm'}
          `}>
            {renderContent()}
            {type !== 'sticker' && (
              <div className={`flex items-center gap-1.5 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                {isEdited && <span className="text-xs opacity-50">bearbeitet</span>}
                <span className="text-xs opacity-70 font-medium">{formatTime(created_date)}</span>
                {getStatusIcon()}
              </div>
            )}
          </div>

          {/* Hover actions */}
          {showActions && (
            <div className={`absolute top-1 ${isOwn ? 'left-0 -translate-x-full pr-2' : 'right-0 translate-x-full pl-2'} hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10`}>
              <button onClick={() => setShowReactions(true)} className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-full transition-colors shadow-lg"><Smile className="w-4 h-4 text-white" /></button>
              <button onClick={() => onReply(message)} className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-full transition-colors shadow-lg"><Reply className="w-4 h-4 text-white" /></button>
              <button onClick={handleCopy} className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-full transition-colors shadow-lg"><Copy className="w-4 h-4 text-white" /></button>
              {onForward && <button onClick={() => onForward(message)} className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-full transition-colors shadow-lg"><Forward className="w-4 h-4 text-white" /></button>}
              {isOwn && onDelete && (
                <button onClick={() => onDelete(message)} className="p-2 bg-zinc-700 hover:bg-red-600/80 rounded-full transition-colors shadow-lg"><Trash2 className="w-4 h-4 text-white" /></button>
              )}
            </div>
          )}

          {showReactions && (
            <ReactionPicker onSelect={(emoji) => { onReact(msgId, emoji); setShowReactions(false); }} onClose={() => setShowReactions(false)} />
          )}
        </div>

        <div className="sm:hidden flex items-center gap-1 mt-1">
          <button onClick={() => setShowReactions(true)} className="px-2 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300"><Smile className="w-3.5 h-3.5" /></button>
          <button onClick={() => onReply(message)} className="px-2 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300"><Reply className="w-3.5 h-3.5" /></button>
          <button onClick={handleCopy} className="px-2 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300"><Copy className="w-3.5 h-3.5" /></button>
          {onForward && (
            <button onClick={() => onForward(message)} className="px-2 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300"><Forward className="w-3.5 h-3.5" /></button>
          )}
          {isOwn && onDelete && (
            <button onClick={() => onDelete(message)} className="px-2 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300"><Trash2 className="w-3.5 h-3.5" /></button>
          )}
        </div>

        {reactions && typeof reactions === 'object' && Object.keys(reactions).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {Object.entries(reactions).map(([emoji, users]) => {
              const userList = Array.isArray(users) ? users : [];
              const hasReacted = userList.includes(currentUser?.id);
              return (
                <button key={emoji} onClick={() => onReact(msgId, emoji)} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm transition-all ${hasReacted ? 'bg-green-600/30 border-2 border-green-500 scale-110' : 'bg-zinc-800 border border-zinc-700 hover:bg-zinc-700'}`}>
                  <span className="text-base">{emoji}</span>
                  <span className={`text-xs font-semibold ${hasReacted ? 'text-green-400' : 'text-gray-400'}`}>{userList.length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {status === 'failed' && isOwn && (
        <button onClick={() => onRetry?.(message)} className="mt-1 flex items-center gap-1 text-xs text-red-400 hover:text-red-300">
          <RefreshCw className="w-3 h-3" /> Erneut
        </button>
      )}
    </div>
  );

  // Wrap in swipeable on touch devices
  return (
    <SwipeableMessage isOwn={isOwn} onSwipe={() => onReply?.(message)}>
      {bubble}
    </SwipeableMessage>
  );
});

export default MessageBubble;