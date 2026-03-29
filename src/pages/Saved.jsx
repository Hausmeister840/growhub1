import { useState, useEffect } from "react";
import { base44 } from '@/api/base44Client';
import { Bookmark, Loader2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import PostCard from "../components/feed/PostCard";
import { usePost } from "../components/hooks/usePost";

export default function Saved() {
  const [currentUser, setCurrentUser] = useState(null);
  const [savedPosts, setSavedPosts] = useState([]);
  const [users, setUsers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const { handleReaction, handleBookmark, handleDelete } = usePost();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      // Filter server-side for bookmarked posts
      const bookmarked = await base44.entities.Post.filter(
        { bookmarked_by_users: user.email },
        '-created_date',
        100
      );
      setSavedPosts(bookmarked || []);

      // Load users only for bookmarked posts
      if (bookmarked && bookmarked.length > 0) {
        const creatorEmails = [...new Set(bookmarked.map(p => p.created_by).filter(Boolean))];
        if (creatorEmails.length > 0) {
          const userResults = await Promise.all(
            creatorEmails.map(email => base44.entities.User.filter({ email }).catch(() => []))
          );
          const userMap = {};
          userResults.flat().forEach(u => {
            if (u?.email) {
              userMap[u.email] = {
                id: u.id,
                email: u.email,
                full_name: u.full_name,
                username: u.username,
                avatar_url: u.avatar_url
              };
            }
          });
          setUsers(userMap);
        }
      }

    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
          <p className="text-zinc-500 text-sm">Lade gespeicherte Beiträge...</p>
        </div>
      </div>
    );
  }

  if (savedPosts.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-zinc-900 rounded-full flex items-center justify-center">
            <Bookmark className="w-10 h-10 text-zinc-600" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Keine gespeicherten Beiträge</h2>
          <p className="text-zinc-400 mb-6">
            Speichere Beiträge um sie später einfach wiederzufinden. Klicke auf das Lesezeichen-Icon bei Posts die dir gefallen!
          </p>
          <Button
            onClick={() => navigate(createPageUrl('Feed'))}
            className="bg-green-600 hover:bg-green-700 gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Feed erkunden
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      <div className="sticky top-14 lg:top-0 z-20 bg-black/95 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Bookmark className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Gespeichert</h1>
              <p className="text-xs text-zinc-400">{savedPosts.length} Beiträge</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {savedPosts.map(post => {
          const postUser = users[post.created_by] || {
            id: null,
            email: post.created_by,
            full_name: post.created_by?.split('@')[0] || 'Grower',
            username: post.created_by?.split('@')[0] || 'grower',
            avatar_url: null
          };

          return (
            <PostCard
              key={post.id}
              post={post}
              user={postUser}
              currentUser={currentUser}
              onReact={(postId, type) => handleReaction(postId, type, currentUser, (updated) => {
                setSavedPosts(prev => prev.map(p => p.id === postId ? { ...p, reactions: updated } : p));
              })}
              onBookmark={(postId) => handleBookmark(postId, currentUser, (updated) => {
                setSavedPosts(prev => prev.map(p => p.id === postId ? { ...p, bookmarked_by_users: updated } : p));
              })}
              onDelete={(postId) => handleDelete(postId, currentUser, () => {
                setSavedPosts(prev => prev.filter(p => p.id !== postId));
              })}
            />
          );
        })}
      </div>
    </div>
  );
}