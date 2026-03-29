import { base44 } from '@/api/base44Client';

/**
 * Call backend search endpoint. Falls back to empty results on error.
 */
export async function globalSearch(query) {
  try {
    const response = await base44.functions.invoke('search/globalSearch', { query });
    return response.data || { posts: [], users: [], tags: [] };
  } catch (err) {
    console.warn('Search error:', err);
    return { posts: [], users: [], tags: [] };
  }
}