
import { useEffect, useCallback, useRef } from 'react';
import { usePostStore } from '../stores/usePostStore';
import { Post } from '@/entities/Post';
import { rateLimiter } from '../services/RateLimiter';

/**
 * 🔄 LIVE UPDATES HOOK
 * ✅ WITH AGGRESSIVE RATE-LIMIT PROTECTION
 */

export function useLiveUpdates(enabled = true, interval = 60000) { // ✅ Increased from 30s to 60s
  const { posts, updatePost, addPosts } = usePostStore();
  const intervalRef = useRef(null);
  const lastCheckRef = useRef(Date.now());
  const isCheckingRef = useRef(false);

  const checkForUpdates = useCallback(async () => {
    if (!enabled || isCheckingRef.current) return;

    // ✅ Check global rate limiter
    if (!rateLimiter.canMakeRequest('/Post')) {
      console.warn('⚠️ Live updates: Rate limit, skipping...');
      return;
    }

    isCheckingRef.current = true;

    try {
      console.log('🔄 Checking for updates...');

      // ✅ Wait for rate limiter slot
      await rateLimiter.waitForSlot('/Post');

      const latestPosts = await Post.list('-created_date', 20);
      
      if (!latestPosts || latestPosts.length === 0) {
        isCheckingRef.current = false;
        return;
      }

      // Check if there are new posts
      const newestPostDate = new Date(latestPosts[0].created_date).getTime();
      const lastCheckTime = lastCheckRef.current;

      if (newestPostDate > lastCheckTime) {
        const newPosts = latestPosts.filter(p => 
          new Date(p.created_date).getTime() > lastCheckTime
        );

        if (newPosts.length > 0) {
          console.log(`✅ Found ${newPosts.length} new posts`);
          addPosts(newPosts);
        }
      }

      // Update comment counts
      const postMap = new Map(latestPosts.map(p => [p.id, p]));
      
      posts.slice(0, 20).forEach(existingPost => {
        const updatedPost = postMap.get(existingPost.id);
        if (updatedPost && updatedPost.comments_count !== existingPost.comments_count) {
          console.log(`📊 Updating comment count for post ${existingPost.id}`);
          updatePost(existingPost.id, { comments_count: updatedPost.comments_count });
        }
      });

      lastCheckRef.current = Date.now();

    } catch (error) {
      if (error.message?.includes('Rate limit') || error.message?.includes('429')) {
        console.warn('⚠️ Live updates: Rate limit hit, skipping...');
      } else {
        console.error('Live updates error:', error);
      }
    } finally {
      isCheckingRef.current = false;
    }
  }, [enabled, posts, addPosts, updatePost]);

  useEffect(() => {
    if (!enabled) return;

    // ✅ Delay initial check by 5 seconds
    const initialTimeout = setTimeout(() => {
      checkForUpdates();
    }, 5000);

    // Set up interval
    intervalRef.current = setInterval(checkForUpdates, interval);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, checkForUpdates]);

  return {
    checkForUpdates
  };
}

export default useLiveUpdates;
