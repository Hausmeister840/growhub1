import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, ArrowLeft, Loader2, TrendingUp, Hash, X, Sparkles, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import PostCard from "../components/feed/PostCard";
import UserCard from "../components/profile/UserCard";
import { toast } from "sonner";

// ✅ SANITIZATION HELPER
const sanitizeSearchQuery = (query) => {
  if (!query) return '';
  return query
    .replace(/[<>"'&]/g, '') // Entferne gefährliche Zeichen
    .replace(/\s+/g, ' ')     // Mehrfache Leerzeichen normalisieren
    .trim();
};

function SearchEmptyState({ icon: Icon, title, hint }) {
  return (
    <div className="mx-4 my-8 gh-content-section p-8 text-center space-y-3">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
        <Icon className="w-8 h-8 text-zinc-500" />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm text-zinc-500 max-w-xs mx-auto leading-relaxed">{hint}</p>
    </div>
  );
}

export default function Search() {
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("posts");
  const [searchResults, setSearchResults] = useState({ posts: [], users: [], tags: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [trendingTopics, setTrendingTopics] = useState([
    "#grow", "#hydroponics", "#led", "#autoflower", "#cbd"
  ]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [suggestedLoading, setSuggestedLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Load current user + suggested users
  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setCurrentUser(me);
        setSuggestedLoading(true);
        const allUsers = await base44.entities.User.list('-xp', 20);
        setSuggestedUsers(allUsers.filter(u => u.id !== me.id).slice(0, 8));
      } catch {
        setCurrentUser(null);
      } finally {
        setSuggestedLoading(false);
      }
    })();
  }, []);

  const performSearch = useCallback(async (query) => {
    // ✅ VALIDIERUNG & SANITIZATION
    const sanitized = sanitizeSearchQuery(query);
    
    if (!sanitized || sanitized.length < 2) {
      toast.warning("Suchbegriff zu kurz", {
        description: "Bitte mindestens 2 Zeichen eingeben"
      });
      setSearchResults({ posts: [], users: [], tags: [] });
      return;
    }

    setIsSearching(true);
    const trimmedQuery = sanitized.toLowerCase();

    try {
      // Search posts and users in parallel
      const [allPosts, allUsers] = await Promise.all([
        base44.entities.Post.filter({ status: 'published' }, '-created_date', 100).catch(() => []),
        base44.entities.User.list('-created_date', 100).catch(() => [])
      ]);

      const matchingPosts = (allPosts || []).filter(post => 
        post.content?.toLowerCase().includes(trimmedQuery) ||
        post.tags?.some(tag => tag.toLowerCase().includes(trimmedQuery))
      );
      const matchingUsers = allUsers.filter(user =>
        user.full_name?.toLowerCase().includes(trimmedQuery) ||
        user.username?.toLowerCase().includes(trimmedQuery) ||
        user.email?.toLowerCase().includes(trimmedQuery) ||
        user.bio?.toLowerCase().includes(trimmedQuery)
      );

      // Extract matching tags
      const tagSet = new Set();
      allPosts.forEach(post => {
        if (post.tags) {
          post.tags.forEach(tag => {
            if (tag.toLowerCase().includes(trimmedQuery)) {
              tagSet.add(tag);
            }
          });
        }
      });

      setSearchResults({
        posts: matchingPosts.slice(0, 50),
        users: matchingUsers.slice(0, 20),
        tags: Array.from(tagSet).slice(0, 10)
      });
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Suchfehler", {
        description: "Bitte versuche es erneut"
      });
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Check for query parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const query = urlParams.get('query');
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [location.search, performSearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const handleTrendingClick = (topic) => {
    const clean = topic.startsWith('#') ? topic.slice(1) : topic;
    setSearchQuery(clean);
    performSearch(clean);
  };

  const handleBack = () => {
    navigate('/Feed');
  };

  const tabs = [
    { key: "posts", label: "Posts", count: searchResults.posts.length },
    { key: "users", label: "Nutzer", count: searchResults.users.length },
    { key: "tags", label: "Tags", count: searchResults.tags.length }
  ];

  return (
    <div className="min-h-screen bg-black pb-20 lg:pb-0">
      {/* Header */}
      <div className="sticky top-14 lg:top-0 z-20 bg-black/95 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="rounded-full flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-white">Suche</h1>
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearch} className="relative">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Durchsuche Posts, Nutzer, Gruppen und mehr"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border-zinc-800 text-white pl-12 pr-12 h-12 rounded-full"
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults({ posts: [], users: [], tags: [] });
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </form>
        </div>

        {/* Tabs - Only show when we have results */}
        {(searchResults.posts.length > 0 || searchResults.users.length > 0 || searchResults.tags.length > 0) && (
          <div className="flex border-t border-zinc-800/30">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex-1 px-4 py-3 text-[15px] font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'text-white'
                    : 'text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300'
                }`}
              >
                <span className="relative z-10">
                  {tab.label} {tab.count > 0 && <span className="text-zinc-500">({tab.count})</span>}
                </span>
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="searchTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-green-500 rounded-t-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto">
        {isSearching ? (
          <div className="flex items-center justify-center p-12" role="status" aria-live="polite" aria-busy="true">
            <Loader2 className="w-8 h-8 text-green-500 animate-spin" aria-hidden />
          </div>
        ) : searchQuery.trim().length === 0 ? (
          /* Trending & Suggestions */
          <div className="p-6 space-y-8">
            {/* Trending Topics */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <h2 className="text-lg font-bold text-white">Trending Topics</h2>
              </div>
              <div className="space-y-2">
                {trendingTopics.map((topic, index) => (
                  <motion.button
                    key={topic}
                    onClick={() => handleTrendingClick(topic)}
                    className="w-full text-left p-4 rounded-xl bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors border border-zinc-800/30"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white">{topic}</p>
                        <p className="text-sm text-zinc-500">
                          Trending
                        </p>
                      </div>
                      <Hash className="w-5 h-5 text-zinc-600" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Discover Growers */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-green-400" />
                <h2 className="text-lg font-bold text-white">Entdecke Grower</h2>
              </div>
              {suggestedLoading ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-16 bg-zinc-900/50 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : suggestedUsers.length > 0 ? (
                <div className="space-y-2">
                  {suggestedUsers.map((user, idx) => (
                    <UserCard key={user.id} user={user} currentUser={currentUser} index={idx} />
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 text-zinc-500">
                  <p>Noch keine Nutzer gefunden</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Search Results */
          <AnimatePresence mode="wait">
            {activeTab === "posts" && (
              <motion.div
                key="posts"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="divide-y divide-zinc-800/30"
              >
                {searchResults.posts.length === 0 ? (
                  <div className="p-12 text-center text-zinc-500">
                    Keine Posts gefunden
                  </div>
                ) : (
                  searchResults.posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      user={{ id: null, email: post.created_by, full_name: post.created_by?.split('@')[0] || "User", username: post.created_by?.split('@')[0] }}
                      currentUser={currentUser}
                      onReact={() => {}}
                      onBookmark={() => {}}
                      onDelete={() => {}}
                      onCommentClick={(p) => navigate(`/PostThread?id=${p.id}`)}
                      onMediaClick={(p) => navigate(`/PostThread?id=${p.id}`)}
                    />
                  ))
                )}
              </motion.div>
            )}

            {activeTab === "users" && (
              <motion.div
                key="users"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 space-y-2"
              >
                {searchResults.users.length === 0 ? (
                  <div className="p-12 text-center text-zinc-500">
                    Keine Nutzer gefunden
                  </div>
                ) : (
                  searchResults.users.map((user, idx) => (
                    <UserCard key={user.id} user={user} currentUser={currentUser} index={idx} />
                  ))
                )}
              </motion.div>
            )}

            {activeTab === "tags" && (
              <motion.div
                key="tags"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 space-y-2"
              >
                {searchResults.tags.length === 0 ? (
                  <div className="p-12 text-center text-zinc-500">
                    Keine Tags gefunden
                  </div>
                ) : (
                  searchResults.tags.map((tag) => (
                    <motion.button
                      key={tag}
                      onClick={() => handleTrendingClick(tag)}
                      className="w-full text-left p-4 rounded-xl bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors border border-zinc-800/30"
                      whileHover={{ x: 4 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Hash className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{tag}</p>
                          <p className="text-sm text-zinc-500">Tag</p>
                        </div>
                      </div>
                    </motion.button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}