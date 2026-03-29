import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Heart, Trash2, MessageCircle, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

function CommentAvatar({ user, size = 'md' }) {
  const px = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs';
  const profileUrl = `/Profile?id=${user?.id || user?.email || ''}`;

  if (user?.avatar_url) {
    return (
      <Link to={profileUrl} onClick={e => e.stopPropagation()}>
        <img src={user.avatar_url} alt="" className={`${px} rounded-full object-cover flex-shrink-0`} />
      </Link>
    );
  }

  const initial = (user?.full_name?.[0] || user?.username?.[0] || user?.email?.[0] || '?').toUpperCase();
  return (
    <Link to={profileUrl} onClick={e => e.stopPropagation()}>
      <div className={`${px} rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold flex-shrink-0`}>
        {initial}
      </div>
    </Link>
  );
}

function timeAgo(date) {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: false, locale: de });
}

function ReplyItem({ reply, currentUser, onReply, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const author = reply.author || {};
  const isOwner = currentUser?.email === reply.author_email || currentUser?.email === reply.created_by;
  const displayName = author.username || author.full_name || reply.author_email?.split('@')[0] || 'Nutzer';

  const handleDelete = useCallback(async () => {
    if (reply.isOptimistic) return;
    setDeleting(true);
    try {
      await base44.entities.Comment.delete(reply.id);
      toast.success('Gelöscht');
      onDeleted?.(reply.id);
    } catch (err) {
      console.error('Delete reply error:', err);
      toast.error('Fehler beim Löschen');
    } finally {
      setDeleting(false);
    }
  }, [reply.id, reply.isOptimistic, onDeleted]);

  return (
    <div className={`flex gap-2.5 py-2 ${deleting ? 'opacity-40' : ''}`}>
      <CommentAvatar user={author} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <Link
            to={`/Profile?id=${author.id || author.email || ''}`}
            className="font-semibold text-xs text-white hover:text-green-400 transition-colors"
            onClick={e => e.stopPropagation()}
          >
            {displayName}
          </Link>
          <span className="text-[10px] text-zinc-500">{timeAgo(reply.created_date)}</span>
        </div>
        <p className="text-[13px] text-zinc-300 mt-0.5 whitespace-pre-wrap break-words leading-snug">{reply.content}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <button
            onClick={() => onReply?.(reply)}
            className="text-[11px] text-zinc-500 hover:text-zinc-300 font-medium transition-colors"
          >
            Antworten
          </button>
          {isOwner && (
            <button
              onClick={handleDelete}
              className="text-[11px] text-zinc-600 hover:text-red-400 font-medium transition-colors"
            >
              Löschen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommentItem({
  comment,
  author,
  currentUser,
  onReply,
  onReact,
  replies = [],
  isPostAuthor = false,
  onCommentDeleted
}) {
  const [showReplies, setShowReplies] = useState(false);
  const [liked, setLiked] = useState(() => {
    if (!comment) return false;
    const likeData = comment.reactions?.byType?.like || comment.reactions?.like;
    return likeData?.users?.includes(currentUser?.email) || false;
  });
  const [likeCount, setLikeCount] = useState(() => {
    if (!comment) return 0;
    const likeData = comment.reactions?.byType?.like || comment.reactions?.like;
    return likeData?.count || 0;
  });
  const [deleting, setDeleting] = useState(false);

  const handleLike = useCallback(() => {
    if (!comment) return;
    if (!currentUser) {
      toast.error('Bitte melde dich an');
      return;
    }
    const next = !liked;
    setLiked(next);
    setLikeCount(prev => next ? prev + 1 : Math.max(0, prev - 1));
    onReact?.(comment.id, 'like');
  }, [liked, currentUser, comment, onReact]);

  const handleDelete = useCallback(async () => {
    if (!comment || comment.isOptimistic) return;
    setDeleting(true);
    try {
      await base44.entities.Comment.delete(comment.id);
      toast.success('Kommentar gelöscht');
      onCommentDeleted?.(comment.id);
    } catch (err) {
      console.error('Delete comment error:', err);
      toast.error('Fehler beim Löschen');
    } finally {
      setDeleting(false);
    }
  }, [comment, onCommentDeleted]);

  if (!comment) return null;

  const resolvedAuthor = author || {
    email: comment.author_email,
    full_name: comment.author_email?.split('@')[0],
    username: null,
    avatar_url: null,
    id: null
  };

  const displayName = resolvedAuthor.username || resolvedAuthor.full_name || resolvedAuthor.email?.split('@')[0] || 'Nutzer';
  const isOwner = currentUser?.email === comment.author_email || currentUser?.email === comment.created_by;
  const profileUrl = `/Profile?id=${resolvedAuthor.id || resolvedAuthor.email || ''}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: deleting ? 0.3 : 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className={`flex gap-3 ${comment.isOptimistic ? 'opacity-50' : ''}`}>
        <CommentAvatar user={resolvedAuthor} />

        <div className="flex-1 min-w-0">
          {/* Name + time row */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <Link
              to={profileUrl}
              className="font-semibold text-[13px] text-white hover:text-green-400 transition-colors"
              onClick={e => e.stopPropagation()}
            >
              {displayName}
            </Link>
            {isPostAuthor && (
              <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-medium">Autor</span>
            )}
            <span className="text-[11px] text-zinc-500">{timeAgo(comment.created_date)}</span>
          </div>

          {/* Comment text */}
          <p className="text-[14px] text-zinc-200 mt-1 whitespace-pre-wrap break-words leading-relaxed">
            {comment.content}
          </p>

          {comment.isOptimistic && (
            <span className="text-[11px] text-zinc-500 mt-1 block">Senden...</span>
          )}

          {/* Action row */}
          {!comment.isOptimistic && (
            <div className="flex items-center gap-4 mt-2">
              {/* Like button */}
              <button
                onClick={handleLike}
                className="flex items-center gap-1 group transition-colors"
              >
                <Heart
                  className={`w-3.5 h-3.5 transition-all ${liked ? 'fill-red-500 text-red-500 scale-110' : 'text-zinc-500 group-hover:text-zinc-300'}`}
                />
                {likeCount > 0 && (
                  <span className={`text-[11px] font-medium ${liked ? 'text-red-400' : 'text-zinc-500'}`}>
                    {likeCount}
                  </span>
                )}
              </button>

              {/* Reply button */}
              <button
                onClick={() => onReply?.(comment)}
                className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">Antworten</span>
              </button>

              {/* Delete button – only for owner */}
              {isOwner && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1 text-zinc-600 hover:text-red-400 transition-colors ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Replies toggle */}
          {replies.length > 0 && (
            <button
              onClick={() => setShowReplies(prev => !prev)}
              className="flex items-center gap-1 mt-2.5 text-[12px] text-green-400 hover:text-green-300 font-medium transition-colors"
            >
              <div className="w-6 h-px bg-zinc-700 mr-1" />
              {showReplies ? 'Antworten ausblenden' : `${replies.length} Antwort${replies.length > 1 ? 'en' : ''} anzeigen`}
              <ChevronDown className={`w-3 h-3 transition-transform ${showReplies ? 'rotate-180' : ''}`} />
            </button>
          )}

          {/* Replies list */}
          <AnimatePresence>
            {showReplies && replies.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-1 ml-1 border-l border-zinc-800/60 pl-3"
              >
                {replies.map(reply => (
                  <ReplyItem
                    key={reply.id}
                    reply={reply}
                    currentUser={currentUser}
                    onReply={onReply}
                    onDeleted={onCommentDeleted}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}