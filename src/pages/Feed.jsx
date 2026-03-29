import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Eye, RefreshCw, AlertTriangle, Clock3 } from "lucide-react";
import { useLocation } from 'react-router-dom';

import FuturisticPostCard from '../components/feed/FuturisticPostCard';
import CommentsModal from '../components/comments/CommentsModal';
import PullToRefresh from '../components/ui/PullToRefresh';
// SwipeableFeed removed — adds touch overhead and framer-motion cost to every scroll
import UndoSnackbar from '../components/feed/UndoSnackbar';
import useFeedStore from '../components/feed/useFeedStore';
import { PostSkeleton } from '../components/ui/LoadingSkeleton';
import { buildFallbackUser } from '../components/utils/terminology';
import SwipeTabs from '../components/feed/SwipeTabs';
import FeedPreloader from '../components/feed/FeedPreloader';
import { useAuth } from '@/lib/AuthContext';

const INITIAL_TAB_LIMIT = 20;
const LOAD_MORE_LIMIT = 20;
const FEED_TABS = [
  { id: 'all', label: 'Alle' },
  { id: 'trending', label: 'Trending' },
  { id: 'following', label: 'Folge ich' }
];

export default function Feed() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tagFromUrl = queryParams.get('tag');

  const { user: currentUser } = useAuth();
  // followingEmails no longer needed — server handles follow filtering
  const [activeTab, setActiveTab] = useState("all");
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const [showComments, setShowComments] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [undoState, setUndoState] = useState(null);
  const undoTimerRef = useRef(null);

  const observerRef = useRef(null);
  const loadMoreTriggerRef = useRef(null);
  const tabRefs = useRef([]);
  const tabContainerRef = useRef(null);
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });

  const {
    posts: allPosts,
    users,
    isLoading,
    tabPosts,
    tabLoading,
    tabAppending,
    tabError,
    lastUpdated,
    tabHasMore,
    tabOffsets,
    loadPosts,
    optimisticDelete,
    optimisticLike,
    optimisticBookmark,
    incrementCommentCount,
  } = useFeedStore();

  const deferredSearchQuery = searchQuery;
  const blockedUserSet = useMemo(() => new Set(currentUser?.blocked_users || []), [currentUser?.blocked_users]);
  const mutedUserSet = useMemo(() => new Set(currentUser?.muted_users || []), [currentUser?.muted_users]);

  // Load current tab first; defer other tabs until actually needed.
  const initialLoadRef = useRef(false);
  const loadedTabsRef = useRef(new Set());
  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      loadPosts({ tab: 'all', limit: INITIAL_TAB_LIMIT });
      loadedTabsRef.current.add('all');
    }
  }, [loadPosts]);

  // Refresh active tab every 5 min
  useEffect(() => {
    const interval = setInterval(() => loadPosts({ silent: true, tab: activeTab, limit: INITIAL_TAB_LIMIT }), 300000);
    return () => clearInterval(interval);
  }, [loadPosts, activeTab]);

  // Per-tab filtering helper
  const filterPosts = useCallback((sourcePosts) => {
    const query = deferredSearchQuery.toLowerCase().trim();
    const activeTag = tagFromUrl?.toLowerCase();

    let filtered = (sourcePosts || []).filter((p) =>
      p && p.id && !blockedUserSet.has(p.created_by) && !mutedUserSet.has(p.created_by)
    );

    if (query) {
      filtered = filtered.filter((p) => {
        if (query.startsWith('#')) {
          const tag = query.slice(1);
          return tag && p.tags?.some((t) => t.toLowerCase().includes(tag));
        }
        if (query.startsWith('@')) {
          const username = query.slice(1);
          if (!username) return true;
          const author = users[(p.created_by || '').toLowerCase()] || users[p.created_by] || users[p.created_by_id];
          return author?.username?.toLowerCase().includes(username) || author?.full_name?.toLowerCase().includes(username);
        }
        return p.content?.toLowerCase().includes(query);
      });
    }

    if (activeTag && !query) {
      filtered = filtered.filter((p) => p.tags?.some((t) => t.toLowerCase() === activeTag));
    }

    return filtered;
  }, [deferredSearchQuery, tagFromUrl, blockedUserSet, mutedUserSet, users]);

  // Per-tab filtered + paginated data
  const tabDataMap = useMemo(() => {
    const result = {};
    for (const tab of FEED_TABS) {
      const source = tabPosts[tab.id] || [];
      const filtered = filterPosts(source);
      const visible = filtered.map((post) => {
        const authorEmail = (post.created_by || '').trim().toLowerCase();
        const matchedUser = (authorEmail && users[authorEmail])
          || (post.created_by && users[post.created_by])
          || (post.created_by_id && users[post.created_by_id])
          || null;
        const postUser = matchedUser || buildFallbackUser(post.created_by || post.created_by_id || '');
        return { post, postUser };
      });
      result[tab.id] = { filtered, visible, hasMore: Boolean(tabHasMore[tab.id]) };
    }
    return result;
  }, [tabPosts, filterPosts, users, tabHasMore]);

  const formatLastUpdated = useCallback((timestamp) => {
    if (!timestamp) return null;
    const d = new Date(timestamp);
    return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }, []);

  const visiblePosts = tabDataMap[activeTab]?.visible || [];

  const loadMore = useCallback(() => {
    if (!tabHasMore[activeTab]) return;
    loadPosts({
      tab: activeTab,
      limit: LOAD_MORE_LIMIT,
      offset: tabOffsets[activeTab] || 0,
      append: true,
      silent: true,
    });
  }, [activeTab, loadPosts, tabHasMore, tabOffsets]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    const trigger = loadMoreTriggerRef.current;
    if (!trigger || !tabHasMore[activeTab] || tabAppending[activeTab]) return;
    observerRef.current = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: '500px' }
    );
    observerRef.current.observe(trigger);
    return () => { if (observerRef.current) observerRef.current.disconnect(); };
  }, [activeTab, tabHasMore, tabAppending, loadMore, visiblePosts.length]);

  // ---------- HANDLERS ----------
  const handleRefresh = useCallback(async () => {
    setSearchQuery('');
    try {
      // Only refresh active tab for speed
      await loadPosts({ force: true, tab: activeTab, limit: INITIAL_TAB_LIMIT });
      toast.success('Feed aktualisiert!');
    } catch (error) {
      toast.error('Aktualisierung fehlgeschlagen. Bitte versuche es erneut.');
      console.warn('Feed refresh failed:', error);
    }
  }, [loadPosts, activeTab]);

  // When connection returns, refresh current tab once.
  useEffect(() => {
    const handleOnline = () => {
      loadPosts({ tab: activeTab, force: true, limit: INITIAL_TAB_LIMIT, silent: true });
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [activeTab, loadPosts]);

  // Listen for post created events from global CreatePost modal
  useEffect(() => {
    const handlePostCreated = () => {
      loadPosts({ force: true, tab: 'all', limit: INITIAL_TAB_LIMIT });
    };
    window.addEventListener('postCreated', handlePostCreated);
    return () => window.removeEventListener('postCreated', handlePostCreated);
  }, [loadPosts]);

  const handleDeletePost = useCallback((postId) => {
    // Clear previous undo timer
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

    const result = optimisticDelete(postId);
    if (result?.undo) {
      setUndoState({ message: 'Post gelöscht', undo: result.undo });
      // Auto-clear undo state after 6s (matches delete timer)
      undoTimerRef.current = setTimeout(() => setUndoState(null), 6200);
    }
    if (navigator.vibrate) navigator.vibrate(10);
  }, [optimisticDelete]);

  const handleLike = useCallback((postId, reactionType = 'like') => {
    if (!currentUser) return;
    optimisticLike(postId, currentUser.email, reactionType);
    if (navigator.vibrate) navigator.vibrate(5);
    // Notification is created server-side in toggleReaction — no duplicate needed here
  }, [currentUser, optimisticLike]);

  const handleBookmark = useCallback((postId) => {
    if (!currentUser) return;
    const post = Object.values(tabPosts).flat().find((p) => p?.id === postId);
    const wasBookmarked = post?.bookmarked_by_users?.includes(currentUser.email);
    optimisticBookmark(postId, currentUser.email);
    toast.success(wasBookmarked ? 'Gespeichert entfernt' : 'Gespeichert!', { duration: 1500 });
  }, [currentUser, optimisticBookmark, tabPosts]);

  const handleCommentAdded = useCallback((postId) => {
    incrementCommentCount(postId);
  }, [incrementCommentCount]);

  const handleTabChange = useCallback((tabId, index) => {
    setActiveTab(tabId);
    setActiveTabIndex(typeof index === 'number' ? index : FEED_TABS.findIndex(t => t.id === tabId));
    // Lazy-load tab on first visit
    if (!loadedTabsRef.current.has(tabId)) {
      loadedTabsRef.current.add(tabId);
      loadPosts({ tab: tabId, limit: INITIAL_TAB_LIMIT });
    }
  }, [loadPosts]);

  const handleSwipeIndex = useCallback((newIndex) => {
    const tab = FEED_TABS[newIndex];
    if (tab) handleTabChange(tab.id, newIndex);
  }, [handleTabChange]);

  // Measure active tab button to position underline precisely
  useEffect(() => {
    const btn = tabRefs.current[activeTabIndex];
    const container = tabContainerRef.current;
    if (btn && container) {
      const containerRect = container.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      setUnderlineStyle({
        left: btnRect.left - containerRect.left + (btnRect.width - Math.min(btnRect.width, 48)) / 2,
        width: Math.min(btnRect.width, 48),
      });
    }
  }, [activeTabIndex]);

  // Loading skeleton
  if (isLoading && allPosts.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--gh-bg)]">
        <div className="sticky top-0 z-20 bg-[#0a0a0a] border-b border-white/[0.06]">
          <div className="max-w-[980px] mx-auto px-3 lg:px-6 py-3">
            <div className="flex gap-2">
              {FEED_TABS.map((tab) => (
                <div key={tab.id} className="h-9 w-24 rounded-full bg-white/[0.04] animate-pulse" />
              ))}
            </div>
          </div>
        </div>
        <div className="max-w-[980px] mx-auto px-0 lg:px-6 py-2 space-y-3">
          {[1, 2, 3].map(i => <PostSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="w-full min-h-screen bg-[var(--gh-bg)]">

        {/* Feed Tabs - TikTok style */}
        <div className="z-30 pt-2 lg:pt-5">
          <div className="max-w-[1040px] mx-auto px-3 lg:px-6">
            <div
              ref={tabContainerRef}
              className="relative rounded-xl lg:rounded-2xl border border-white/[0.1] bg-gradient-to-b from-white/[0.06] to-white/[0.02] backdrop-blur-xl px-3 lg:px-6 shadow-[0_12px_30px_rgba(0,0,0,0.34)] lg:shadow-[0_24px_70px_rgba(0,0,0,0.5)]"
            >
              <div className="flex justify-center gap-6 lg:gap-8 py-2.5 lg:py-3">
              {FEED_TABS.map((tab, idx) => {
                const isActive = activeTabIndex === idx;
                return (
                  <button
                    key={tab.id}
                    ref={el => tabRefs.current[idx] = el}
                    onClick={() => handleTabChange(tab.id, idx)}
                    className={`relative text-[14px] lg:text-[15px] font-semibold transition-colors duration-200 pb-0.5 ${
                      isActive ? 'text-white' : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            {/* Animated underline indicator */}
              <div
                className="absolute bottom-0 h-[2.5px] bg-white rounded-full transition-all duration-300 ease-out"
                style={{
                  width: underlineStyle.width,
                  left: underlineStyle.left,
                }}
              />
              <div className="border-t border-white/[0.08] py-2 flex items-center justify-between text-[10px] lg:text-[11px] text-zinc-400">
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="w-3 h-3" />
                  {lastUpdated[activeTab] ? `Zuletzt aktualisiert: ${formatLastUpdated(lastUpdated[activeTab])}` : 'Noch nicht aktualisiert'}
                </span>
                <button
                  onClick={handleRefresh}
                  className="inline-flex items-center gap-1 text-zinc-300 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Aktualisieren
                </button>
              </div>
              <div className="border-t border-white/[0.04] py-1.5 text-center text-[10px] text-zinc-500 lg:hidden">
                Wische links/rechts, um Tabs zu wechseln
              </div>
            </div>
          </div>
        </div>

        {/* Swipeable Content Panels */}
        <SwipeTabs activeIndex={activeTabIndex} onChangeIndex={handleSwipeIndex}>
          {FEED_TABS.map((tab) => {
            const td = tabDataMap[tab.id] || { visible: [], hasMore: false };
            const isTabLoading = tabLoading[tab.id];
            const tabVisible = td.visible;
            const tabHasMore = td.hasMore;

            return (
              <div key={tab.id} className="max-w-[1040px] mx-auto px-2 lg:px-6 py-3">
                {tabError[tab.id] && (
                  <div className="mx-3 lg:mx-0 mb-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="text-xs">
                      <p className="text-amber-200">{tabError[tab.id]}</p>
                      <button
                        onClick={() => loadPosts({ tab: tab.id, force: true, limit: INITIAL_TAB_LIMIT })}
                        className="mt-1 text-amber-300 hover:text-amber-200 underline underline-offset-2"
                      >
                        Erneut versuchen
                      </button>
                    </div>
                  </div>
                )}
                {isTabLoading && tabVisible.length === 0 ? (
                  <div className="py-20 flex justify-center">
                    <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : tabVisible.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="text-center py-28 px-6"
                  >
                    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-500/10 to-emerald-500/5 rounded-3xl flex items-center justify-center border border-green-500/10">
                      <Eye className="w-11 h-11 text-green-500/30" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2.5">
                      {tab.id === 'following' ? 'Keine Beiträge von Followings' : 'Noch keine Beiträge'}
                    </h3>
                    <p className="text-[var(--gh-text-muted)] text-sm mb-10 max-w-[260px] mx-auto leading-relaxed">
                      {tab.id === 'following' ? 'Folge anderen Growern, um deren Beiträge hier zu sehen!' : 'Sei der Erste und teile etwas mit der Community!'}
                    </p>
                    {currentUser && tab.id !== 'following' && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => window.dispatchEvent(new Event('openCreatePost'))}
                        className="gh-btn-primary px-10 py-3.5 text-[15px] shadow-lg shadow-green-500/20"
                      >
                        <Plus className="w-4 h-4 inline mr-2" />
                        Post erstellen
                      </motion.button>
                    )}
                  </motion.div>
                ) : (
                  <>
                    <div className="space-y-3 lg:space-y-4">
                      {tabVisible.map(({ post, postUser }, idx) => (
                        <FuturisticPostCard
                          key={post.id}
                          post={post}
                          user={postUser}
                          currentUser={currentUser}
                          index={idx}
                          onLike={(reactionType) => handleLike(post.id, reactionType)}
                          onBookmark={() => handleBookmark(post.id)}
                          onDelete={() => handleDeletePost(post.id)}
                          onCommentAdded={handleCommentAdded}
                          onCommentClick={(p) => {
                            if (!p?.id) return;
                            setSelectedPost(p);
                            setShowComments(true);
                          }}
                        />
                      ))}
                    </div>
                    {tabHasMore && activeTab === tab.id && (
                      <div ref={loadMoreTriggerRef} className="py-8 flex justify-center">
                        {tabAppending[tab.id] ? (
                          <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                            Lädt mehr…
                          </div>
                        ) : (
                          <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </SwipeTabs>

          {/* Undo Snackbar */}
          <AnimatePresence>
            {undoState && (
              <UndoSnackbar
                key="undo"
                message={undoState.message}
                onUndo={() => {
                  if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
                  undoState.undo();
                  setUndoState(null);
                  toast.success('Rückgängig gemacht!');
                }}
                onDismiss={() => setUndoState(null)}
                duration={6000}
              />
            )}
          </AnimatePresence>

        {/* Preload upcoming media for smooth scrolling */}
        <FeedPreloader posts={visiblePosts} currentIndex={0} ahead={12} />

        {showComments && selectedPost && (
          <CommentsModal
            post={selectedPost}
            currentUser={currentUser}
            isOpen={showComments}
            onClose={() => { setShowComments(false); setSelectedPost(null); }}
            onCommentAdded={handleCommentAdded}
          />
        )}

      </div>
    </PullToRefresh>
  );
}