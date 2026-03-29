import { useState, useEffect } from "react";
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, MessageSquare, Trash2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { motion } from "framer-motion";

export default function AdminContentModeration({ onStatsUpdate }) {
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [users, setUsers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const [allPosts, allComments, allUsers] = await Promise.all([
        base44.entities.Post.list('-created_date', 500),
        base44.entities.Comment.list('-created_date', 500),
        base44.entities.User.list()
      ]);

      const userMap = {};
      (allUsers || []).forEach(u => {
        if (u?.email) userMap[u.email] = u;
      });

      setPosts(allPosts || []);
      setComments(allComments || []);
      setUsers(userMap);
    } catch (error) {
      console.error("Load content error:", error);
      toast.error("Fehler beim Laden");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Post wirklich löschen?")) return;

    try {
      await base44.entities.Post.delete(postId);
      toast.success("Post gelöscht");
      loadContent();
      onStatsUpdate?.();
    } catch (error) {
      console.error('Delete post error:', error);
      toast.error("Löschen fehlgeschlagen");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Kommentar wirklich löschen?")) return;

    try {
      await base44.entities.Comment.delete(commentId);
      toast.success("Kommentar gelöscht");
      loadContent();
      onStatsUpdate?.();
    } catch (error) {
      console.error('Delete comment error:', error);
      toast.error("Löschen fehlgeschlagen");
    }
  };

  const handleApprovePost = async (postId) => {
    try {
      await base44.entities.Post.update(postId, {
        status: "published",
        moderation_status: "allow",
        requires_manual_review: false
      });
      toast.success("Post freigegeben");
      loadContent();
      onStatsUpdate?.();
    } catch (error) {
      console.error('Approve error:', error);
      toast.error("Aktion fehlgeschlagen");
    }
  };

  const handleRejectPost = async (postId) => {
    try {
      await base44.entities.Post.update(postId, {
        status: "removed",
        moderation_status: "block",
        requires_manual_review: false,
        visibility: 'private'
      });
      toast.success("Post blockiert");
      loadContent();
      onStatsUpdate?.();
    } catch (error) {
      console.error('Reject error:', error);
      toast.error("Aktion fehlgeschlagen");
    }
  };

  const filteredPosts = posts.filter(p => {
    if (filter === "reported") return p.requires_manual_review || p.moderation_status === "pending";
    if (filter === "blocked") return p.status === "removed";
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex gap-3">
        <Button
          onClick={() => setFilter("all")}
          variant={filter === "all" ? "default" : "outline"}
          className={filter === "all" ? "bg-green-600" : "border-zinc-700"}
        >
          Alle ({posts.length})
        </Button>
        <Button
          onClick={() => setFilter("reported")}
          variant={filter === "reported" ? "default" : "outline"}
          className={filter === "reported" ? "bg-red-600" : "border-zinc-700"}
        >
          Gemeldet ({posts.filter(p => p.requires_manual_review).length})
        </Button>
        <Button
          onClick={() => setFilter("blocked")}
          variant={filter === "blocked" ? "default" : "outline"}
          className={filter === "blocked" ? "bg-zinc-600" : "border-zinc-700"}
        >
          Blockiert ({posts.filter(p => p.status === "removed").length})
        </Button>
      </div>

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="bg-zinc-900 border border-zinc-800 rounded-2xl">
          <TabsTrigger value="posts" className="data-[state=active]:bg-zinc-800">
            <FileText className="w-4 h-4 mr-2" />
            Posts ({filteredPosts.length})
          </TabsTrigger>
          <TabsTrigger value="comments" className="data-[state=active]:bg-zinc-800">
            <MessageSquare className="w-4 h-4 mr-2" />
            Kommentare ({comments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-3 mt-6">
          {filteredPosts.map((post) => {
            const author = users[post.created_by];
            
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={author?.avatar_url || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${post.created_by}`}
                      alt={author?.full_name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-semibold text-white">{author?.full_name || "Unbekannt"}</p>
                      <p className="text-xs text-zinc-400">
                        {formatDistanceToNow(new Date(post.created_date), { addSuffix: true, locale: de })}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {post.status === "removed" ? (
                      <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                        Blockiert
                      </span>
                    ) : post.requires_manual_review ? (
                      <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Prüfung erforderlich
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                        Freigegeben
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-zinc-200 mb-4">{post.content}</p>

                {post.media_urls && post.media_urls.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {post.media_urls.slice(0, 2).map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt=""
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  <div className="flex gap-4 text-sm text-zinc-400">
                    <span>{Object.values(post.reactions || {}).reduce((a, b) => a + (b?.count || 0), 0)} Reaktionen</span>
                    <span>{post.comments_count || 0} Kommentare</span>
                    <span>{post.view_count || 0} Aufrufe</span>
                  </div>

                  <div className="flex gap-2">
                    {post.status !== "removed" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprovePost(post.id)}
                          className="border-green-500/30 text-green-400"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Freigeben
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectPost(post.id)}
                          className="border-yellow-500/30 text-yellow-400"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Blockieren
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeletePost(post.id)}
                      className="border-red-500/30 text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-zinc-400">Keine Posts gefunden</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="comments" className="space-y-3 mt-6">
          {comments.map((comment) => {
            const author = users[comment.author_email];
            
            return (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <img
                      src={author?.avatar_url || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${comment.author_email}`}
                      alt={author?.full_name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-white text-sm">{author?.full_name || "Unbekannt"}</p>
                      <p className="text-zinc-300 text-sm mt-1">{comment.content}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {formatDistanceToNow(new Date(comment.created_date), { addSuffix: true, locale: de })}
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteComment(comment.id)}
                    className="border-red-500/30 text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            );
          })}

          {comments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-zinc-400">Keine Kommentare gefunden</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}