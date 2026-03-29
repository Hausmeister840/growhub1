import { useState, useEffect, useCallback } from 'react';
import FeedCacheService from '../services/FeedCacheService';

/**
 * Hook for cached feed data fetching
 */
export function useFeedCache(fetchFn, cacheKey, dependencies = []) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      // Check cache first
      if (!forceRefresh) {
        const cached = FeedCacheService.get(cacheKey);
        if (cached) {
          setData(cached);
          setIsLoading(false);
          return cached;
        }
      }

      setIsLoading(true);
      const result = await fetchFn();
      
      // Cache the result
      FeedCacheService.set(cacheKey, result);
      setData(result);
      setError(null);
      
      return result;
    } catch (err) {
      setError(err);
      // Try to use stale cache on error
      const staleCache = FeedCacheService.get(cacheKey);
      if (staleCache) {
        setData(staleCache);
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, cacheKey]);

  useEffect(() => {
    fetchData();
  }, dependencies);

  return {
    data,
    isLoading,
    error,
    refetch: () => fetchData(true),
    invalidate: () => FeedCacheService.invalidate(cacheKey)
  };
}

export default useFeedCache;