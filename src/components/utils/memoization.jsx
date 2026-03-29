/**
 * Memoization utilities for expensive calculations
 */

/**
 * Simple memoization with cache size limit
 */
export function memoize(fn, cacheSize = 100) {
  const cache = new Map();
  const keys = [];

  return (...args) => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result);
    keys.push(key);

    // Limit cache size (LRU)
    if (keys.length > cacheSize) {
      const oldestKey = keys.shift();
      cache.delete(oldestKey);
    }

    return result;
  };
}

/**
 * Memoize with TTL (Time To Live)
 */
export function memoizeWithTTL(fn, ttl = 60000) {
  const cache = new Map();

  return (...args) => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.value;
    }

    const result = fn(...args);
    cache.set(key, {
      value: result,
      timestamp: Date.now()
    });

    return result;
  };
}

/**
 * Debounced memoization - useful for search
 */
export function debouncedMemoize(fn, delay = 300) {
  const cache = new Map();
  let timeoutId = null;

  return (...args) => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    return new Promise((resolve) => {
      if (timeoutId) clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        const result = fn(...args);
        cache.set(key, result);
        resolve(result);
      }, delay);
    });
  };
}

/**
 * Calculate engagement score (memoized)
 */
export const calculateEngagementScore = memoize((post) => {
  const likes = post.reactions?.like?.count || 0;
  const comments = post.comments_count || 0;
  const bookmarks = post.bookmarked_by_users?.length || 0;
  const hasMedia = (post.media_urls?.length || 0) > 0;
  
  const ageHours = (Date.now() - new Date(post.created_date).getTime()) / (1000 * 60 * 60);
  const recencyBoost = Math.max(0, 1 - (ageHours / 72));
  
  return (likes * 2) + (comments * 3) + (bookmarks * 1.5) + (hasMedia ? 5 : 0) + (recencyBoost * 10);
});

/**
 * Filter and sort posts (memoized with TTL)
 */
export const filterAndSortPosts = memoizeWithTTL((posts, filters, sortBy) => {
  let filtered = [...posts];

  // Apply filters
  if (filters.search) {
    const query = filters.search.toLowerCase();
    filtered = filtered.filter(p => {
      if (query.startsWith('#')) {
        const tag = query.slice(1);
        return p.tags?.some(t => t.toLowerCase().includes(tag));
      }
      if (query.startsWith('@')) {
        const username = query.slice(1);
        return p.created_by?.toLowerCase().includes(username);
      }
      return p.content?.toLowerCase().includes(query);
    });
  }

  if (filters.tag) {
    filtered = filtered.filter(p => 
      p.tags?.some(t => t.toLowerCase() === filters.tag.toLowerCase())
    );
  }

  // Sort
  switch (sortBy) {
    case 'engagement':
      filtered.sort((a, b) => calculateEngagementScore(b) - calculateEngagementScore(a));
      break;
    case 'recent':
      filtered.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      break;
    default:
      break;
  }

  return filtered;
}, 5000); // 5 second cache

/**
 * Clear all memoization caches
 */
export function clearMemoCache() {
  // This will be called on logout or data refresh
  filterAndSortPosts.cache?.clear?.();
  calculateEngagementScore.cache?.clear?.();
}