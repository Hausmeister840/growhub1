import { useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { feedPersonalizationService } from '@/components/services/FeedPersonalizationService';

export function usePersonalizedFeed() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const offsetRef = useRef(0);
  const isLoadingRef = useRef(false);
  const viewedPostsRef = useRef(new Set());

  // Load initial feed
  const loadFeed = useCallback(async (reset = false) => {
    if (isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;
      if (reset) {
        setIsLoading(true);
        offsetRef.current = 0;
        viewedPostsRef.current.clear();
      }

      // Always use fallback for now (personalized feed function has issues)
      const allPosts = await base44.entities.Post.list('-created_date', 1000);
      const filteredPosts = allPosts.filter(p => p && p.id && (!p.status || p.status === 'published'));

      const newPosts = filteredPosts.slice(offsetRef.current, offsetRef.current + 50);
      const moreAvailable = filteredPosts.length > offsetRef.current + 50;

      if (reset) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }

      setHasMore(moreAvailable);
      offsetRef.current += newPosts.length;
      setError(null);
    } catch (err) {
      console.error('Failed to load personalized feed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  // Load more posts
  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingRef.current) return;
    loadFeed(false);
  }, [hasMore, loadFeed]);

  // Refresh feed
  const refresh = useCallback(() => {
    loadFeed(true);
  }, [loadFeed]);

  // Track post view with intersection observer
  const trackPostView = useCallback((post) => {
    if (!post || viewedPostsRef.current.has(post.id)) return;
    
    viewedPostsRef.current.add(post.id);
    feedPersonalizationService.trackPostView(post);
    
    // Clear old entries if Set gets too large
    if (viewedPostsRef.current.size > 500) {
      const array = Array.from(viewedPostsRef.current);
      viewedPostsRef.current = new Set(array.slice(-250));
    }
    
    // Update view count optimistically
    setPosts(prev => prev.map(p => 
      p.id === post.id 
        ? { ...p, view_count: (p.view_count || 0) + 1 }
        : p
    ));
  }, []);

  // Track interactions
  const trackInteraction = useCallback((post, interactionType) => {
    feedPersonalizationService.trackPostInteraction(post, interactionType);
  }, []);

  // Initial load
  useEffect(() => {
    loadFeed(true);
  }, [loadFeed]);

  return {
    posts,
    isLoading,
    hasMore,
    error,
    loadMore,
    refresh,
    trackPostView,
    trackInteraction
  };
}