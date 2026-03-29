/**
 * Feed cache layer using localStorage.
 * Stores posts + users so the feed can render offline.
 */

const CACHE_KEY = 'growhub_feed_cache';
const CACHE_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

const safeStorage = {
  getItem: (key) => { try { return localStorage.getItem(key); } catch { return null; } },
  setItem: (key, value) => { try { localStorage.setItem(key, value); return true; } catch { return false; } },
  removeItem: (key) => { try { localStorage.removeItem(key); } catch {} },
};

export function saveFeedToCache(tab, posts, users) {
  if (!posts?.length) return;
  const existing = loadAllCaches();
  existing[tab] = {
    posts: posts.slice(0, 30), // Cap at 30 to save storage
    users,
    timestamp: Date.now(),
  };
  safeStorage.setItem(CACHE_KEY, JSON.stringify(existing));
}

export function loadFeedFromCache(tab) {
  const all = loadAllCaches();
  const cached = all[tab];
  if (!cached) return null;

  // Check age
  if (Date.now() - cached.timestamp > CACHE_MAX_AGE_MS) {
    return null;
  }

  return { posts: cached.posts || [], users: cached.users || {} };
}

function loadAllCaches() {
  const raw = safeStorage.getItem(CACHE_KEY);
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

export function clearFeedCache() {
  safeStorage.removeItem(CACHE_KEY);
}

export function isOffline() {
  return !navigator.onLine;
}