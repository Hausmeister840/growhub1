import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const COMMENTS_CACHE_TTL_MS = 30 * 1000;
const commentsCache = new Map();

export default function CommentsModal({
  isOpen,
  onClose,
  post,
  currentUser,
  onCommentAdded
}) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState({});
  const [loadError, setLoadError] = useState(false);
  

  const commentInputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const timeoutRef = useRef(null);

  const loadComments = useCallback(async () => {
    if (!post?.id) return;

    const cacheKey = post.id;
    const cached = commentsCache.get(cacheKey);
    const cacheIsFresh = cached && (Date.now() - cached.ts) < COMMENTS_CACHE_TTL_MS;

    if (cacheIsFresh) {
      const mergedUsers = { ...(cached.users || {}) };
      if (currentUser?.email) {
        mergedUsers[currentUser.email] = {
          ...(mergedUsers[currentUser.email] || {}),
          id: currentUser.id,
          email: currentUser.email,
          full_name: currentUser.full_name,
          username: currentUser.username,
          avatar_url: currentUser.avatar_url,
          verified: currentUser.verified,
        };
      }
      setComments(cached.comments || []);
      setUsers(mergedUsers);
      setIsLoading(false);
      setLoadError(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setLoadError(false);

    try {
      const commentsData = await base44.entities.Comment.filter({ post_id: post.id }, '-created_date');

      if (abortControllerRef.current?.signal.aborted) return;

      const emails = Array.from(new Set(
        (commentsData || []).map(c => c.author_email).filter(Boolean).concat([post?.created_by].filter(Boolean))
      ));

      const resolvedUsers = await base44.functions.invoke('profile/resolveUsers', {
        emails,
        ids: [post?.created_by_id].filter(Boolean),
      }).catch(() => null);

      const userMap = { ...(resolvedUsers?.data?.map || {}) };

      if (currentUser?.email) {
        userMap[currentUser.email] = {
          ...(userMap[currentUser.email] || {}),
          id: currentUser.id,
          email: currentUser.email,
          full_name: currentUser.full_name,
          username: currentUser.username,
          avatar_url: currentUser.avatar_url,
          verified: currentUser.verified,
        };
      }

      setComments(commentsData || []);
      setUsers(userMap);
      commentsCache.set(cacheKey, {
        comments: commentsData || [],
        users: userMap,
        ts: Date.now()
      });
      setLoadError(false);
    } catch (error) {
      if (abortControllerRef.current?.signal.aborted) return;
      setComments([]);
      setLoadError(true);
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [post?.id, currentUser]);

  useEffect(() => {
    if (isOpen && post?.id) {
      loadComments();
    }
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isOpen, post?.id, loadComments]);

  // Close on route change
  useEffect(() => {
    const handleRouteChange = () => onClose();
    window.addEventListener('routeChange', handleRouteChange);
    return () => window.removeEventListener('routeChange', handleRouteChange);
  }, [onClose]);

  const handlePostComment = useCallback(async () => {
    if (!newComment.trim() || isSubmitting) return;
    if (!currentUser) {
      toast.error('Bitte melde dich an');
      return;
    }

    setIsSubmitting(true);
    if (navigator.vibrate) navigator.vibrate(5);

    const tempId = `temp-${Date.now()}`;
    const optimisticComment = {
      id: tempId,
      content: newComment.trim(),
      post_id: post.id,
      author_email: currentUser.email,
      created_date: new Date().toISOString(),
      isOptimistic: true
    };
    if (replyingTo?.id) {
      optimisticComment.parent_comment_id = replyingTo.id;
    }

    setUsers(prev => ({
      ...prev,
      [currentUser.email]: {
        id: currentUser.id,
        email: currentUser.email,
        full_name: currentUser.full_name,
        username: currentUser.username,
        avatar_url: currentUser.avatar_url,
        verified: currentUser.verified
      }
    }));

    setComments(prev => [optimisticComment, ...prev]);
    setNewComment('');
    setReplyingTo(null);

    try {
      const response = await base44.functions.invoke('comments/createComment', {
        postId: post.id,
        content: optimisticComment.content,
        parentCommentId: optimisticComment.parent_comment_id || null,
      });

      const created = response.data?.comment;

      setComments(prev => prev.map(c =>
        c.id === tempId ? { ...(created || optimisticComment), isOptimistic: false } : c
      ));

      if (onCommentAdded) onCommentAdded(post.id);
    } catch (error) {
      setComments(prev => prev.filter(c => c.id !== tempId));
      toast.error('Fehler beim Kommentieren');
    } finally {
      setIsSubmitting(false);
    }
  }, [newComment, currentUser, post, replyingTo, isSubmitting, onCommentAdded]);

  const handleReply = useCallback((comment) => {
    const username = users[comment.author_email]?.username || users[comment.author_email]?.full_name || comment.author_email.split('@')[0];
    setReplyingTo(comment);
    setNewComment(`@${username} `);
    setTimeout(() => commentInputRef.current?.focus(), 100);
  }, [users]);

  const handleReact = useCallback(async (commentId, reactionType) => {
    if (!currentUser) {
      toast.error('Bitte melde dich an');
      return;
    }
    if (commentId.startsWith('temp-')) return;

    if (navigator.vibrate) navigator.vibrate(3);

    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    const reactions = comment.reactions || { total: 0, byType: {} };
    const byType = reactions.byType || {};
    const current = byType[reactionType] || { count: 0, users: [] };
    const usersList = Array.isArray(current.users) ? [...current.users] : [];
    const hasReacted = usersList.includes(currentUser.email);

    const newUsers = hasReacted
      ? usersList.filter(u => u !== currentUser.email)
      : [...usersList, currentUser.email];

    const newByType = {
      ...byType,
      [reactionType]: { count: newUsers.length, users: newUsers }
    };

    const newTotal = Object.values(newByType).reduce((sum, r) => sum + (r.count || 0), 0);

    const updatedReactions = { total: newTotal, byType: newByType };

    setComments(prev => prev.map(c =>
      c.id === commentId ? { ...c, reactions: updatedReactions } : c
    ));

    try {
      await base44.entities.Comment.update(commentId, { reactions: updatedReactions });
    } catch (error) {
      loadComments();
    }
  }, [currentUser, comments, loadComments]);

  const handleCommentDeleted = useCallback(async (deletedId) => {
    const deletedComments = [];
    setComments(prev => {
      const toRemove = prev.filter(c => c.id === deletedId || c.parent_comment_id === deletedId);
      deletedComments.push(...toRemove);
      return prev.filter(c => c.id !== deletedId && c.parent_comment_id !== deletedId);
    });
    if (post?.id && deletedComments.length > 0) {
      const currentPost = await base44.entities.Post.get(post.id).catch(() => null);
      if (currentPost) {
        const newCount = Math.max(0, (currentPost.comments_count || 0) - deletedComments.length);
        base44.entities.Post.update(post.id, { comments_count: newCount }).catch(() => {});
      }
    }
  }, [post?.id]);

  const autoResize = useCallback((e) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  }, []);

  const { topLevelComments, repliesByParent } = useMemo(() => {
    const topLevel = [];
    const replies = {};

    comments.forEach((c) => {
      if (!c.parent_comment_id) {
        topLevel.push(c);
        return;
      }

      if (!replies[c.parent_comment_id]) {
        replies[c.parent_comment_id] = [];
      }
      replies[c.parent_comment_id].push(c);
    });

    return { topLevelComments: topLevel, repliesByParent: replies };
  }, [comments]);

  return (
    <DrawerPrimitive.Root
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      shouldScaleBackground={false}
      modal={true}
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-[99998] bg-black/80" />
        <DrawerPrimitive.Content
          className="fixed inset-x-0 bottom-0 z-[99999] flex flex-col rounded-t-3xl bg-zinc-900 border-t border-zinc-800 outline-none"
          style={{ height: '75vh', maxHeight: '75vh' }}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          {/* Drag handle — this is the key UX element for swipe-to-dismiss */}
          <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
            <div className="w-10 h-1.5 rounded-full bg-zinc-600" />
          </div>

          <DrawerPrimitive.Title className="px-4 pb-3 pt-1 border-b border-zinc-800/60 text-base font-semibold text-white">
            Kommentare{!isLoading && comments.length > 0 ? ` (${comments.length})` : ''}
          </DrawerPrimitive.Title>
          <DrawerPrimitive.Description className="sr-only">
            Kommentare zum Beitrag
          </DrawerPrimitive.Description>

          {/* Scrollable comments area */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-5" style={{ minHeight: 0 }}>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-green-500 animate-spin mb-3" />
                <p className="text-zinc-500 text-sm">Lade Kommentare...</p>
              </div>
            ) : loadError ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
                <p className="text-white font-semibold mb-2">Fehler beim Laden</p>
                <p className="text-zinc-400 text-sm mb-4">Kommentare konnten nicht geladen werden</p>
                <Button onClick={loadComments} className="bg-green-600 hover:bg-green-700">
                  Erneut versuchen
                </Button>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-zinc-400">Noch keine Kommentare</p>
                <p className="text-zinc-500 text-sm mt-1">Sei der Erste!</p>
              </div>
            ) : (
              topLevelComments.map(comment => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  author={users[comment.author_email]}
                  currentUser={currentUser}
                  onReply={handleReply}
                  onReact={handleReact}
                  onCommentDeleted={handleCommentDeleted}
                  replies={(repliesByParent[comment.id] || []).map(r => ({
                    ...r,
                    author: users[r.author_email]
                  }))}
                  isPostAuthor={comment.author_email === post?.created_by}
                />
              ))
            )}
          </div>

          {/* Comment input pinned at bottom */}
          <div className="p-3 border-t border-zinc-800/60 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            {currentUser ? (
              <CommentInput
                user={currentUser}
                newComment={newComment}
                setNewComment={setNewComment}
                handlePostComment={handlePostComment}
                commentInputRef={commentInputRef}
                autoResize={autoResize}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                users={users}
                isSubmitting={isSubmitting}
              />
            ) : (
              <div className="text-center py-4">
                <p className="text-zinc-400 text-sm">Melde dich an, um zu kommentieren</p>
              </div>
            )}
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}