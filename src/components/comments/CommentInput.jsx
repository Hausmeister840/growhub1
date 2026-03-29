import { Send, X } from 'lucide-react';
import { toast } from 'sonner';

export default function CommentInput({
  user,
  newComment,
  setNewComment,
  handlePostComment,
  commentInputRef,
  autoResize,
  replyingTo,
  setReplyingTo,
  users,
  isSubmitting
}) {
  if (!user) return null;

  const onFormSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    const trimmed = newComment.trim();
    if (!trimmed) return;
    if (trimmed.length > 1000) {
      toast.error('Kommentar zu lang (max 1000 Zeichen)');
      return;
    }
    handlePostComment();
  };

  const replyName = replyingTo
    ? users?.[replyingTo.author_email]?.username || users?.[replyingTo.author_email]?.full_name || replyingTo.author_email?.split('@')[0]
    : null;

  const avatarUrl = user?.avatar_url || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${user?.email}`;

  return (
    <div className="space-y-2">
      {replyingTo && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-800/40 rounded-lg">
          <span className="text-xs text-zinc-400">
            Antwort an <span className="text-green-400 font-medium">@{replyName}</span>
          </span>
          <button
            onClick={() => { setReplyingTo(null); setNewComment(''); }}
            className="text-zinc-500 hover:text-white transition-colors p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <form onSubmit={onFormSubmit} className="flex items-end gap-2.5">
        <img
          src={avatarUrl}
          alt=""
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        />
        <div className="flex-1 relative">
          <textarea
            ref={commentInputRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onInput={autoResize}
            placeholder={replyingTo ? `Antwort an @${replyName}...` : 'Kommentar schreiben...'}
            className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-full text-zinc-100 px-4 py-2 pr-11 resize-none overflow-hidden max-h-28 text-sm focus:outline-none focus:border-green-500/50 transition-all placeholder:text-zinc-500"
            rows={1}
            disabled={isSubmitting}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onFormSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="absolute right-1.5 bottom-1 p-1.5 rounded-full text-green-400 disabled:text-zinc-600 hover:text-green-300 transition-colors disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}