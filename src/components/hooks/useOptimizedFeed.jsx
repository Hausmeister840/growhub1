import { useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import GlobalErrorHandler from '../utils/GlobalErrorHandler';

export function useOptimizedFeed(initialLimit = 20) {
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const cache = useRef(new Map());
  const abortController = useRef(null);

  const loadInitial = useCallback(async () => {
    if (abortController.current) {
      abortController.current.abort();
    }

    abortController.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      const cacheKey = 'feed_initial';
      const cached = cache.current.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < 60000) {
        setPosts(cached.posts);
        setUsers(cached.users);
        setIsLoading(false);
        return;
      }

      const [rawPosts, allUsers] = await Promise.all([
        GlobalErrorHandler.withRetry(() => base44.entities.Post.list('-created_date', initialLimit), 3, 1000),
        GlobalErrorHandler.withRetry(() => base44.entities.User.list('-created_date', 100), 2, 800)
      ]);

      if (abortController.current.signal.aborted) return;

      const validPosts = (rawPosts || []).filter(p => 
        p && p.id && (!p.status || p.status === 'published')
      );

      const userMap = {};
      (allUsers || []).forEach(u => {
        if (u && u.email) {
          userMap[u.email] = u;
          if (u.id) userMap[u.id] = u;
        }
      });

      cache.current.set(cacheKey, {
        posts: validPosts,
        users: userMap,
        timestamp: Date.now()
      });

      setPosts(validPosts);
      setUsers(userMap);
      setHasMore(validPosts.length === initialLimit);

    } catch (err) {
      if (err.name !== 'AbortError') {
        GlobalErrorHandler.handleError(err, 'Feed Load');
        setError(err);
      }
    } finally {
      if (!abortController.current?.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [initialLimit]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    try {
      const nextPosts = await GlobalErrorHandler.withRetry(
        () => base44.entities.Post.list('-created_date', initialLimit, page * initialLimit),
        2,
        800
      );

      const validPosts = (nextPosts || []).filter(p => 
        p && p.id && (!p.status || p.status === 'published')
      );

      setPosts(prev => [...prev, ...validPosts]);
      setHasMore(validPosts.length === initialLimit);
      setPage(prev => prev + 1);

    } catch (err) {
      GlobalErrorHandler.handleError(err, 'Load More');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page, initialLimit]);

  const refresh = useCallback(() => {
    cache.current.clear();
    setPage(1);
    setHasMore(true);
    return loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    loadInitial();

    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [loadInitial]);

  return {
    posts,
    users,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh
  };
}