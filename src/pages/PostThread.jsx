import { useEffect, useMemo, useRef, useState } from "react";
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Bookmark, Share2, Play, Pause, X, Maximize2 } from "lucide-react";
import { getCache, setCache } from "@/components/utils/cache";
import CommentItem from "../components/comments/CommentItem";
import CommentInput from "../components/comments/CommentInput";
import ImmersiveMediaViewer from "../components/feed/ImmersiveMediaViewer";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { getDisplayName, getInitials } from '../components/utils/terminology';

export default function PostThread() {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get("postId") || urlParams.get("id");

  const [currentUser, setCurrentUser] = useState(null);
  const [post, setPost] = useState(null);
  const [authorsMap, setAuthorsMap] = useState({});
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [showMediaOverlay, setShowMediaOverlay] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const lastTapRef = useRef(0);
  const videoRef = useRef(null);
  const [videoPlaying, setVideoPlaying] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        let me = null;
        try {
          me = await base44.auth.me();
        } catch (_) {}
        setCurrentUser(me);

        const cached = getCache(`post_${postId}`);
        if (cached) setPost(cached);

        const posts = await base44.entities.Post.filter({ id: postId });
        const p = posts?.[0];
        if (p) {
          setPost(p);
          setCache(`post_${postId}`, p, 2 * 60 * 1000);
        }

        const csCached = getCache(`comments_${postId}`);
        if (csCached) setComments(csCached);

        const cs = await base44.entities.Comment.filter({ post_id: postId }, 'created_date', 500);
        setComments(cs || []);
        setCache(`comments_${postId}`, cs, 2 * 60 * 1000);

        // preload authors via backend resolver
        const emails = Array.from(new Set(
          (cs || []).map(c => c.author_email).filter(Boolean)
            .concat([p?.created_by].filter(Boolean))
        ));
        const ids = [p?.created_by_id].filter(Boolean);
        if (emails.length || ids.length) {
          const resolvedUsers = await base44.functions.invoke('profile/resolveUsers', { emails, ids });
          setAuthorsMap(resolvedUsers?.data?.map || {});
        }
      } catch (error) {
        console.error('PostThread load error:', error);
        toast.error('Fehler beim Laden');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [postId]);

  const isVideo = useMemo(() => {
    const url = post?.media_urls?.[0] || "";
    return /\.(mp4|webm|mov|m4v)$/i.test(url);
  }, [post]);

  const mediaUrl = post?.media_urls?.[0] || "";

  const userHasLiked = useMemo(() => {
    if (!currentUser || !post) return false;
    return post.reactions?.like?.users?.includes(currentUser.email) || false;
  }, [post, currentUser]);

  const totalReactions = useMemo(() => {
    if (!post) return 0;
    return Object.values(post.reactions || {}).reduce((sum, r) => sum + (r?.count || 0), 0);
  }, [post]);

  const toggleLike = async (byDoubleTap = false) => {
    if (!currentUser || !post) return;
    const previousPost = post;
    const currentLike = post.reactions?.like || { count: 0, users: [] };
    const already = currentLike.users?.includes(currentUser.email);
    const nextUsers = already
      ? currentLike.users.filter((email) => email !== currentUser.email)
      : [...(currentLike.users || []), currentUser.email];
    const nextPost = {
      ...post,
      reactions: {
        ...(post.reactions || {}),
        like: {
          count: nextUsers.length,
          users: nextUsers,
        },
      },
    };

    if (!already && byDoubleTap) triggerHeart();
    setPost(nextPost);

    try {
      await base44.functions.invoke('posts/toggleReaction', {
        postId: post.id,
        reactionType: 'like',
      });
    } catch (e) {
      console.error('Like error:', e);
      setPost(previousPost);
      toast.error('Fehler beim Liken');
    }
  };

  const toggleBookmark = async () => {
    if (!currentUser || !post) return;
    const previousPost = post;
    const list = Array.isArray(post.bookmarked_by_users) ? post.bookmarked_by_users : [];
    const has = list.includes(currentUser.email);
    const next = has ? list.filter((email) => email !== currentUser.email) : [...list, currentUser.email];
    setPost({ ...post, bookmarked_by_users: next });
    try {
      await base44.functions.invoke('posts/toggleBookmark', {
        postId: post.id,
        bookmarked: !has,
      });
    } catch (error) {
      console.error('Bookmark error:', error);
      setPost(previousPost);
      toast.error('Fehler beim Speichern');
    }
  };

  const sharePost = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.content?.slice(0, 100) || 'GrowHub Post',
          url
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          navigator.clipboard.writeText(url);
          toast.success('Link kopiert!');
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link kopiert!');
      } catch {
        toast.error('Fehler beim Kopieren');
      }
    }
  };

  const triggerHeart = () => {
    setShowHeart(true);
    if (navigator.vibrate) navigator.vibrate(30);
    setTimeout(() => setShowHeart(false), 850);
  };

  const handleMediaDoubleClick = (e) => {
    e.preventDefault();
    if (!userHasLiked) toggleLike(true);
  };

  const handleMediaTouchEnd = (e) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!userHasLiked) toggleLike(true);
    }
    lastTapRef.current = now;
  };

  const groupedComments = useMemo(() => {
    const byParent = new Map();
    comments.forEach(c => {
      const pid = c.parent_comment_id || null;
      if (!byParent.has(pid)) byParent.set(pid, []);
      byParent.get(pid).push(c);
    });
    // sort top-level by date asc
    const roots = (byParent.get(null) || []).sort((a,b) => new Date(a.created_date) - new Date(b.created_date));
    return { byParent, roots };
  }, [comments]);

  const refreshCountsFromComments = async (count) => {
    const nextPost = { ...post, comments_count: count };
    setPost(nextPost);
    try {
      await base44.entities.Post.update(post.id, { comments_count: count });
    } catch (error) {
      console.error('Update count error:', error);
    }
  };

  const submitComment = async () => {
    if (!currentUser || !post) {
      toast.error("Bitte melde dich an, um zu kommentieren");
      return;
    }
    const text = commentText.trim();
    if (!text) return;

    setSubmitting(true);

    const optimistic = {
      id: `tmp_${Date.now()}`,
      content: text,
      post_id: post.id,
      author_email: currentUser.email,
      parent_comment_id: replyTo?.id || null,
      created_date: new Date().toISOString(),
      isOptimistic: true
    };
    const nextComments = [...comments, optimistic];
    setComments(nextComments);
    setCommentText("");

    try {
      // Use backend function — it updates comments_count AND creates notifications
      const response = await base44.functions.invoke('comments/createComment', {
        postId: post.id,
        content: text,
        parentCommentId: replyTo?.id || null,
      });
      const created = response.data?.comment;
      const finalComment = created || { ...optimistic, id: `real-${Date.now()}`, isOptimistic: false };
      setComments(prev => prev.map(c => (c.id === optimistic.id ? finalComment : c)));
      setReplyTo(null);
      setPost(prev => prev ? { ...prev, comments_count: (prev.comments_count || 0) + 1 } : prev);
    } catch (e) {
      console.error('Comment submit error:', e);
      setComments(comments);
      toast.error("Kommentar konnte nicht gesendet werden");
    } finally {
      setSubmitting(false);
    }
  };

  const topBar = (
    <div className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800 px-3 py-2 flex items-center justify-between">
      <div className="text-sm text-zinc-400">Post</div>
      <Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white" onClick={() => window.history.back()}>
        <X className="w-4 h-4 mr-1" /> Schließen
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-zinc-400">Lade Post …</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-zinc-400">Post nicht gefunden.</div>
      </div>
    );
  }

  const author = authorsMap[(post.created_by || '').toLowerCase()] || authorsMap[post.created_by] || authorsMap[post.created_by_id];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {topBar}

      <div className="max-w-3xl mx-auto p-3 space-y-4">
        <Card className="glass-effect border-zinc-800">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <Link to={`/Profile?id=${author?.id || post.created_by}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-green-600 flex items-center justify-center">
                  {author?.avatar_url ? (
                    <img alt="" src={author.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold">{getInitials(author || { email: post.created_by })}</span>
                  )}
                </div>
                <div>
                  <div className="text-sm font-semibold hover:text-green-400 transition-colors">{getDisplayName(author || { email: post.created_by })}</div>
                  <div className="text-xs text-zinc-500">{new Date(post.created_date).toLocaleString()}</div>
                </div>
              </Link>
              {post.category && (
                <Badge className="bg-zinc-800 text-zinc-300 capitalize">{post.category}</Badge>
              )}
            </div>

            {post.content && (
              <div className="text-zinc-200 mb-2 whitespace-pre-wrap">{post.content}</div>
            )}

            {mediaUrl && (
              <div
                className="relative rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 cursor-pointer"
                onDoubleClick={handleMediaDoubleClick}
                onTouchEnd={handleMediaTouchEnd}
                onClick={() => setShowMediaOverlay(true)}
              >
                <AnimatePresence>
                  {showHeart && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1.1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <Heart className="w-20 h-20 text-red-500 fill-red-500 drop-shadow-[0_0_18px_rgba(239,68,68,0.7)]" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {isVideo ? (
                  <div className="relative">
                    <video
                      ref={videoRef}
                      src={mediaUrl}
                      className="w-full h-auto"
                      autoPlay
                      muted
                      playsInline
                      loop
                      onPlay={() => setVideoPlaying(true)}
                      onPause={() => setVideoPlaying(false)}
                    />
                    <button
                      className="absolute bottom-2 right-2 bg-black/60 rounded-full p-2 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!videoRef.current) return;
                        if (videoRef.current.paused) {
                          videoRef.current.play();
                        } else {
                          videoRef.current.pause();
                        }
                      }}
                      title={videoPlaying ? "Pause" : "Play"}
                    >
                      {videoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      className="absolute top-2 right-2 bg-black/60 rounded-full p-2 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMediaOverlay(true);
                      }}
                      title="Vollbild"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <img src={mediaUrl} alt="" className="w-full h-auto" />
                )}
              </div>
            )}

            <div className="flex items-center gap-3 mt-3">
              <Button
                variant="ghost"
                size="sm"
                className={`px-3 ${userHasLiked ? "text-red-400" : "text-zinc-300"}`}
                onClick={() => toggleLike(false)}
              >
                <Heart className={`w-4 h-4 mr-1 ${userHasLiked ? "fill-red-500 text-red-500" : ""}`} />
                {totalReactions}
              </Button>

              <Button variant="ghost" size="sm" className="px-3 text-zinc-300">
                <MessageCircle className="w-4 h-4 mr-1" />
                {post.comments_count || 0}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className={`px-3 ${Array.isArray(post.bookmarked_by_users) && currentUser && post.bookmarked_by_users.includes(currentUser.email) ? "text-yellow-400" : "text-zinc-300"}`}
                onClick={toggleBookmark}
              >
                <Bookmark className="w-4 h-4 mr-1" />
                Speichern
              </Button>

              <Button variant="ghost" size="sm" className="px-3 text-zinc-300" onClick={sharePost}>
                <Share2 className="w-4 h-4 mr-1" />
                Teilen
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
           <h3 className="text-sm font-semibold text-zinc-300">Kommentare ({comments.length})</h3>

           {currentUser && (
           <CommentInput
             user={currentUser}
             newComment={commentText}
             setNewComment={setCommentText}
             handlePostComment={submitComment}
             commentInputRef={null}
             autoResize={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
             replyingTo={replyTo}
             setReplyingTo={setReplyTo}
             users={authorsMap}
             isSubmitting={submitting}
           />
           )}

           {!currentUser && (
             <div className="text-center py-6 text-zinc-500 text-sm bg-zinc-900/50 rounded-lg">
               Melde dich an, um zu kommentieren
             </div>
           )}

           <div className="space-y-3">
             {groupedComments.roots.map(root => {
               const replies = (groupedComments.byParent.get(root.id) || []).sort((a,b) => new Date(a.created_date) - new Date(b.created_date));
               return (
                 <CommentItem
                   key={root.id}
                   comment={root}
                   author={authorsMap[(root.author_email || '').toLowerCase()] || authorsMap[root.author_email]}
                   currentUser={currentUser}
                   onReply={(c) => {
                     if (!currentUser) return;
                     setReplyTo(c);
                     const replyAuthor = authorsMap[(c.author_email || '').toLowerCase()] || authorsMap[c.author_email];
                     const username = replyAuthor?.username || replyAuthor?.full_name || c.author_email.split('@')[0];
                     setCommentText(`@${username} `);
                   }}
                   onReact={async (commentId, reactionType) => {
                     if (!currentUser) return;
                     if (typeof commentId === 'string' && commentId.startsWith('tmp_')) return;
                     const comment = comments.find(c => c.id === commentId);
                     if (!comment) return;
                     const reactions = comment.reactions || { total: 0, byType: {} };
                     const byType = reactions.byType || {};
                     const current = byType[reactionType] || { count: 0, users: [] };
                     const usersList = Array.isArray(current.users) ? [...current.users] : [];
                     const hasReacted = usersList.includes(currentUser.email);
                     const newUsers = hasReacted ? usersList.filter(u => u !== currentUser.email) : [...usersList, currentUser.email];
                     const newByType = { ...byType, [reactionType]: { count: newUsers.length, users: newUsers } };
                     const newTotal = Object.values(newByType).reduce((sum, r) => sum + (r.count || 0), 0);
                     const updatedReactions = { total: newTotal, byType: newByType };
                     setComments(prev => prev.map(c => c.id === commentId ? { ...c, reactions: updatedReactions } : c));
                     try {
                       await base44.entities.Comment.update(commentId, { reactions: updatedReactions });
                     } catch {
                       toast.error('Fehler');
                     }
                   }}
                   onCommentDeleted={async () => {
                     const cs = await base44.entities.Comment.filter({ post_id: postId }, 'created_date', 500);
                     setComments(cs || []);
                     refreshCountsFromComments((cs || []).length);
                   }}
                   replies={replies.map(r => ({ ...r, author: authorsMap[(r.author_email || '').toLowerCase()] || authorsMap[r.author_email] }))}
                   isPostAuthor={root.author_email === post?.created_by}
                   reactions={root.reactions}
                   globalReactionOptions={[
                     { type: 'like', emoji: '❤️' },
                     { type: 'fire', emoji: '🔥' },
                     { type: 'laugh', emoji: '😂' },
                     { type: 'helpful', emoji: '💡' }
                   ]}
                 />
               );
             })}
             {groupedComments.roots.length === 0 && (
               <div className="text-sm text-zinc-500 text-center py-6">Noch keine Kommentare.</div>
             )}
           </div>
        </div>
      </div>

      {showMediaOverlay && post?.media_urls?.length > 0 && (
        <ImmersiveMediaViewer
          isOpen={showMediaOverlay}
          onClose={() => setShowMediaOverlay(false)}
          post={post}
          initialIndex={0}
        />
      )}
    </div>
  );
}