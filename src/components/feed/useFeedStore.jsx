import { useState, useCallback, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { flattenPost, flattenPosts } from '../utils/dataUtils';
import { saveFeedToCache, loadFeedFromCache, isOffline } from '../offline/FeedCache';

/**
 * Local feed state manager with optimistic updates.
 * No full-reload on create/delete/edit/like.
 */
export default function useFeedStore() {
  // Per-tab post caches: { all: [...], trending: [...], following: [...] }
  const [tabPosts, setTabPosts] = useState({ all: [], trending: [], following: [] });
  const [users, setUsers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState({ all: false, trending: false, following: false });
  const [tabAppending, setTabAppending] = useState({ all: false, trending: false, following: false });
  const [tabError, setTabError] = useState({ all: null, trending: null, following: null });
  const [lastUpdated, setLastUpdated] = useState({ all: null, trending: null, following: null });
  const [tabHasMore, setTabHasMore] = useState({ all: true, trending: true, following: true });
  const [tabOffsets, setTabOffsets] = useState({ all: 0, trending: 0, following: 0 });
  const undoBufferRef = useRef(null);
  const loadingTabsRef = useRef(new Set());
  const userCacheRef = useRef({});
  const unsubscribeRef = useRef(null);
  // Track posts with in-flight reaction updates — suppress realtime overwrites
  const reactionInFlightRef = useRef(new Set());

  // Backward compat: expose "posts" as default tab list.
  const posts = tabPosts.all || [];

  // Helper to update posts across ALL tabs (for optimistic updates)
  const updateAllTabs = useCallback((updater) => {
    setTabPosts(prev => {
      const next = {};
      for (const key of Object.keys(prev)) {
        next[key] = updater(prev[key]);
      }
      return next;
    });
  }, []);

  const mergeById = useCallback((existingPosts, incomingPosts) => {
    const map = new Map();
    (existingPosts || []).forEach((p) => { if (p?.id) map.set(p.id, p); });
    (incomingPosts || []).forEach((p) => { if (p?.id) map.set(p.id, p); });
    return Array.from(map.values());
  }, []);

  // ---------- LOAD (initial + background refresh, with offline cache) ----------
  const loadPosts = useCallback(async (opts = {}) => {
    const tab = opts.tab || 'all';
    const requestedLimit = Math.min(Math.max(Number(opts.limit) || 20, 10), 60);
    const shouldAppend = Boolean(opts.append);
    const requestedOffset = Math.max(0, Number(opts.offset ?? (shouldAppend ? tabOffsets[tab] || 0 : 0)));
    if (loadingTabsRef.current.has(tab) && !opts.force) return;
    loadingTabsRef.current.add(tab);
    if (!opts.silent) {
      setIsLoading(true);
      setTabLoading(prev => ({ ...prev, [tab]: true }));
    }
    if (shouldAppend) {
      setTabAppending(prev => ({ ...prev, [tab]: true }));
    }
    setTabError(prev => ({ ...prev, [tab]: null }));

    // Serve cache first for instant render, then fetch fresh data
    const cached = loadFeedFromCache(tab);
    if (!shouldAppend && cached && cached.posts?.length > 0) {
      const flattened = flattenPosts(cached.posts);
      if (cached.users) userCacheRef.current = { ...userCacheRef.current, ...cached.users };
      setTabPosts(prev => ({ ...prev, [tab]: flattened }));
      setUsers({ ...userCacheRef.current });
      setTabOffsets(prev => ({ ...prev, [tab]: flattened.length }));
      setIsLoading(false);
      setTabLoading(prev => ({ ...prev, [tab]: false }));
    }

    if (isOffline()) {
      loadingTabsRef.current.delete(tab);
      return;
    }

    try {
      const response = await base44.functions.invoke('feed/getSmartFeed', {
        tab,
        limit: requestedLimit,
        offset: requestedOffset,
      });

      const { posts: rawPosts, users: fetchedUsers } = response.data || {};

      const published = (rawPosts || []).filter(p => p && p.id);
      const flattened = flattenPosts(published);

      if (fetchedUsers && typeof fetchedUsers === 'object') {
        userCacheRef.current = { ...userCacheRef.current, ...fetchedUsers };
      }

      setTabPosts(prev => ({
        ...prev,
        [tab]: shouldAppend ? mergeById(prev[tab], flattened) : flattened,
      }));
      setUsers({ ...userCacheRef.current });
      setLastUpdated(prev => ({ ...prev, [tab]: Date.now() }));
      setTabHasMore(prev => ({ ...prev, [tab]: Boolean(response?.data?.hasMore) }));
      setTabOffsets(prev => ({
        ...prev,
        [tab]: Number(response?.data?.nextOffset ?? (requestedOffset + flattened.length)),
      }));

      // Save to offline cache
      if (!shouldAppend) saveFeedToCache(tab, published, fetchedUsers);
      } catch (err) {
      // Robust fallback: if smart feed function is unavailable, load entities directly.
      try {
        const rawPosts = await base44.entities.Post.filter({ status: 'published' }, '-created_date', 60);

        let fallbackPosts = rawPosts || [];

        if (tab === 'trending') {
          fallbackPosts = [...fallbackPosts]
            .sort((a, b) => {
              const scoreA = (a.engagement_score || 0) + (a.viral_score || 0) + (a.comments_count || 0) * 2 + (a.view_count || 0) * 0.02;
              const scoreB = (b.engagement_score || 0) + (b.viral_score || 0) + (b.comments_count || 0) * 2 + (b.view_count || 0) * 0.02;
              return scoreB - scoreA;
            })
            .slice(requestedOffset, requestedOffset + requestedLimit);
        } else if (tab === 'following') {
          try {
            const me = await base44.auth.me();
            const follows = await base44.entities.Follow.filter({ follower_id: me.id });
            const followedEmails = new Set((follows || []).map((f) => f.followee_email).filter(Boolean));
            fallbackPosts = fallbackPosts.filter((p) => followedEmails.has(p.created_by));
            fallbackPosts = fallbackPosts.slice(requestedOffset, requestedOffset + requestedLimit);
          } catch {
            fallbackPosts = [];
          }
        } else {
          fallbackPosts = fallbackPosts.slice(requestedOffset, requestedOffset + requestedLimit);
        }

        const authorEmails = [...new Set(fallbackPosts.map((p) => p.created_by).filter(Boolean))];
        const authorIds = [...new Set(fallbackPosts.map((p) => p.created_by_id).filter(Boolean))];
        const [byEmail, byId] = await Promise.all([
          authorEmails.length
            ? base44.entities.User.filter({ email: { $in: authorEmails } })
            : [],
          authorIds.length
            ? base44.entities.User.filter({ id: { $in: authorIds } })
            : [],
        ]);
        const mergedUsers = [...(byEmail || []), ...(byId || [])];
        const userMap = {};
        const seen = new Set();
        mergedUsers.forEach((u) => {
          if (!u?.id || seen.has(u.id)) return;
          seen.add(u.id);
          if (u.email) userMap[u.email] = u;
          userMap[u.id] = u;
        });

        userCacheRef.current = { ...userCacheRef.current, ...userMap };
        const flattenedFallback = flattenPosts(fallbackPosts);
        setTabPosts(prev => ({
          ...prev,
          [tab]: shouldAppend ? mergeById(prev[tab], flattenedFallback) : flattenedFallback,
        }));
        setUsers({ ...userCacheRef.current });
        setLastUpdated(prev => ({ ...prev, [tab]: Date.now() }));
        setTabHasMore(prev => ({ ...prev, [tab]: fallbackPosts.length >= requestedLimit }));
        setTabOffsets(prev => ({ ...prev, [tab]: requestedOffset + fallbackPosts.length }));
        setTabError(prev => ({
          ...prev,
          [tab]: 'Smart-Feed nicht erreichbar, Fallback-Daten werden angezeigt.',
        }));
      } catch (fallbackErr) {
        console.error('Feed load error:', err);
        console.error('Feed fallback error:', fallbackErr);
        setTabError(prev => ({
          ...prev,
          [tab]: 'Feed konnte nicht geladen werden. Bitte versuche es erneut.',
        }));
      }
    } finally {
      setIsLoading(false);
      setTabLoading(prev => ({ ...prev, [tab]: false }));
      setTabAppending(prev => ({ ...prev, [tab]: false }));
      loadingTabsRef.current.delete(tab);
    }
  }, [mergeById, tabOffsets]);

  // ---------- OPTIMISTIC CREATE ----------
  const optimisticCreate = useCallback((newPost) => {
    updateAllTabs(prev => [newPost, ...prev]);
  }, [updateAllTabs]);

  const finalizeCreate = useCallback((tempId, realPost) => {
    updateAllTabs(prev => prev.map(p => p.id === tempId ? { ...realPost } : p));
  }, [updateAllTabs]);

  const rollbackCreate = useCallback((tempId) => {
    updateAllTabs(prev => prev.filter(p => p.id !== tempId));
  }, [updateAllTabs]);

  // ---------- OPTIMISTIC DELETE + UNDO ----------
  const optimisticDelete = useCallback((postId) => {
    // Cancel any previous undo timer
    if (undoBufferRef.current?.timer) {
      clearTimeout(undoBufferRef.current.timer);
      const prev = undoBufferRef.current;
      if (prev.postId && prev.postId !== postId) {
        base44.entities.Post.delete(prev.postId).catch(() => {});
      }
    }

    const snapshotRef = { post: null, index: -1 };

    updateAllTabs(prev => {
      const idx = prev.findIndex(p => p.id === postId);
      if (idx >= 0) {
        if (!snapshotRef.post) { snapshotRef.post = prev[idx]; snapshotRef.index = idx; }
        return prev.filter(p => p.id !== postId);
      }
      return prev;
    });

    const deleteTimer = setTimeout(async () => {
      try {
        await base44.entities.Post.delete(postId);
      } catch {
        if (snapshotRef.post) {
          updateAllTabs(prev => {
            const restored = [...prev];
            restored.splice(Math.min(snapshotRef.index, restored.length), 0, snapshotRef.post);
            return restored;
          });
          toast.error('Löschen fehlgeschlagen');
        }
      }
      undoBufferRef.current = null;
    }, 6000);

    undoBufferRef.current = { postId, timer: deleteTimer };

    return {
      undo: () => {
        clearTimeout(deleteTimer);
        if (snapshotRef.post) {
          updateAllTabs(prev => {
            const restored = [...prev];
            restored.splice(Math.min(snapshotRef.index, restored.length), 0, snapshotRef.post);
            return restored;
          });
        }
        undoBufferRef.current = null;
      }
    };
  }, [updateAllTabs]);

  // ---------- OPTIMISTIC EDIT ----------
  const optimisticEdit = useCallback((postId, updates) => {
      let oldPost = null;

      updateAllTabs(prev => {
        if (!Array.isArray(prev)) return prev;
        return prev.map(p => {
          if (!p) return p;
          if (p.id === postId) {
            if (!oldPost) oldPost = { ...p };
            return { ...p, ...updates, _saving: true };
          }
          return p;
        });
      });

    (async () => {
      try {
        await base44.entities.Post.update(postId, updates);
        updateAllTabs(prev => {
                if (!Array.isArray(prev)) return prev;
                return prev.map(p => p?.id === postId ? { ...p, _saving: false } : p);
              });
      } catch {
        if (oldPost) {
              updateAllTabs(prev => {
                if (!Array.isArray(prev)) return prev;
                return prev.map(p => p?.id === postId ? oldPost : p);
              });
        }
        toast.error('Änderungen konnten nicht gespeichert werden');
      }
    })();
  }, [updateAllTabs]);

  // ---------- OPTIMISTIC REACTION (like + all types) ----------
  const optimisticLike = useCallback((postId, userEmail, reactionType = 'like') => {
    const capturedRef = { oldReactions: null, newReactions: null };

    updateAllTabs(prev => {
      if (!Array.isArray(prev)) return prev;
      return prev.map(p => {
        if (!p || p.id !== postId) return p;

        const reactions = JSON.parse(JSON.stringify(p.reactions || {}));
        const bucket = reactions[reactionType] || { count: 0, users: [] };
        const bucketUsers = Array.isArray(bucket.users) ? bucket.users : [];
        const wasReacted = bucketUsers.includes(userEmail);

        if (!capturedRef.oldReactions) capturedRef.oldReactions = reactions;

        const newUsers = wasReacted
          ? bucketUsers.filter(e => e !== userEmail)
          : [...bucketUsers, userEmail];

        const newReactions = {
          ...reactions,
          [reactionType]: { count: newUsers.length, users: newUsers }
        };
        capturedRef.newReactions = newReactions;

        return { ...p, reactions: newReactions };
      });
    });

    reactionInFlightRef.current.add(postId);
    setTimeout(async () => {
      if (!capturedRef.newReactions) return;
      try {
        await base44.functions.invoke('posts/toggleReaction', {
          postId,
          reactionType
        });
      } catch (error) {
        if (capturedRef.oldReactions) {
          updateAllTabs(prev => prev.map(p =>
            p.id === postId ? { ...p, reactions: capturedRef.oldReactions } : p
          ));
        }
        console.error('Reaction sync failed:', error);
        toast.error('Reaktion fehlgeschlagen');
      } finally {
        reactionInFlightRef.current.delete(postId);
      }
    }, 0);
  }, [updateAllTabs]);

  // ---------- OPTIMISTIC COMMENT COUNT ----------
  const incrementCommentCount = useCallback((postId) => {
      updateAllTabs(prev => {
        if (!Array.isArray(prev)) return prev;
        return prev.map(p => 
          p?.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p
        );
      });
    }, [updateAllTabs]);

  // ---------- OPTIMISTIC BOOKMARK ----------
  const optimisticBookmark = useCallback((postId, userEmail) => {
      const capturedRef = { oldBookmarks: null, newBookmarks: null };

      updateAllTabs(prev => {
        if (!Array.isArray(prev)) return prev;
        return prev.map(p => {
          if (!p || p.id !== postId) return p;
          const bookmarks = Array.isArray(p.bookmarked_by_users) ? [...p.bookmarked_by_users] : [];
          if (!capturedRef.oldBookmarks) capturedRef.oldBookmarks = bookmarks;
          const isBookmarked = bookmarks.includes(userEmail);
          const newBookmarks = isBookmarked
            ? bookmarks.filter(e => e !== userEmail)
            : [...bookmarks, userEmail];
          capturedRef.newBookmarks = newBookmarks;
          return { ...p, bookmarked_by_users: newBookmarks };
        });
      });

    setTimeout(async () => {
      if (!capturedRef.newBookmarks) return;
      try {
        await base44.functions.invoke('posts/toggleBookmark', {
          postId,
          bookmarked: !capturedRef.oldBookmarks?.includes(userEmail)
        });
      } catch {
        if (capturedRef.oldBookmarks) {
          updateAllTabs(prev => prev.map(p =>
            p.id === postId ? { ...p, bookmarked_by_users: capturedRef.oldBookmarks } : p
          ));
        }
        toast.error('Speichern fehlgeschlagen');
      }
    }, 0);
  }, [updateAllTabs]);

  // Real-time subscriptions (re-subscribe after reconnect)
  useEffect(() => {
    const subscribe = () => {
      try {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
        unsubscribeRef.current = base44.entities.Post.subscribe((event) => {
          if (!event || !event.id) return;

          updateAllTabs((prev) => {
            const idx = prev.findIndex((p) => p.id === event.id);

            if (event.type === 'create') {
              if (prev.some((p) => p.id === event.id)) return prev;
              const createdPost = flattenPost({ id: event.id, ...(event.data || {}) });
              return createdPost ? [createdPost, ...prev] : prev;
            }

            if (event.type === 'update' && idx >= 0) {
              if (reactionInFlightRef.current.has(event.id)) return prev;
              return prev.map((p) => {
                if (p.id !== event.id) return p;
                const mergedPost = flattenPost({ ...p, ...(event.data || {}), id: event.id });
                return mergedPost || p;
              });
            }

            if (event.type === 'delete' && idx >= 0) {
              return prev.filter((p) => p.id !== event.id);
            }

            return prev;
          });
        });
      } catch (error) {
        console.warn('Feed subscription failed:', error);
      }
    };

    subscribe();
    window.addEventListener('online', subscribe);

    return () => {
      window.removeEventListener('online', subscribe);
      if (unsubscribeRef.current) {
        try {
          unsubscribeRef.current();
        } catch (e) {
          console.warn('Feed unsubscribe failed:', e);
        }
        unsubscribeRef.current = null;
      }
    };
  }, [updateAllTabs]);

  return {
    posts,
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
    optimisticCreate, finalizeCreate, rollbackCreate,
    optimisticDelete,
    optimisticEdit,
    optimisticLike,
    optimisticBookmark,
    incrementCommentCount,
  };
}