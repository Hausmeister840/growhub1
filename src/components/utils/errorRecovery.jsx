// Error Recovery Utilities

export const safeJSONParse = (str, fallback = null) => {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

export const safeArrayAccess = (arr, index, fallback = null) => {
  if (!Array.isArray(arr) || index < 0 || index >= arr.length) {
    return fallback;
  }
  return arr[index];
};

export const safeObjectAccess = (obj, path, fallback = null) => {
  if (!obj || typeof obj !== 'object') return fallback;
  
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return fallback;
    }
  }
  
  return result;
};

export const withDefault = (value, defaultValue) => {
  return value !== null && value !== undefined ? value : defaultValue;
};

export const ensureArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
};

export const ensureObject = (value) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  return {};
};

export const cleanUserData = (user) => {
  if (!user) return null;
  
  return {
    id: user.id || '',
    email: user.email || '',
    full_name: user.full_name || user.username || user.email?.split('@')[0] || 'User',
    username: user.username || user.email?.split('@')[0] || 'user',
    avatar_url: user.avatar_url || null,
    verified: user.verified || false,
    role: user.role || 'user'
  };
};

export const cleanPostData = (post) => {
  if (!post) return null;
  
  return {
    ...post,
    media_urls: ensureArray(post.media_urls),
    tags: ensureArray(post.tags),
    reactions: ensureObject(post.reactions),
    comments_count: withDefault(post.comments_count, 0),
    view_count: withDefault(post.view_count, 0),
    bookmarked_by_users: ensureArray(post.bookmarked_by_users)
  };
};