// Prop validation utilities

export const validatePost = (post) => {
  if (!post || typeof post !== 'object') {
    console.warn('Invalid post object:', post);
    return null;
  }

  if (!post.id) {
    console.warn('Post missing required id:', post);
    return null;
  }

  return {
    id: post.id,
    content: post.content || '',
    created_by: post.created_by || '',
    created_date: post.created_date || new Date().toISOString(),
    reactions: post.reactions || {},
    comments_count: post.comments_count || 0,
    media_urls: Array.isArray(post.media_urls) ? post.media_urls : [],
    tags: Array.isArray(post.tags) ? post.tags : [],
    bookmarked_by_users: Array.isArray(post.bookmarked_by_users) ? post.bookmarked_by_users : [],
    type: post.type || 'text',
    status: post.status || 'published'
  };
};

export const validateUser = (user) => {
  if (!user || typeof user !== 'object') {
    console.warn('Invalid user object:', user);
    return null;
  }

  return {
    id: user.id || '',
    email: user.email || '',
    full_name: user.full_name || user.email?.split('@')[0] || 'User',
    username: user.username || user.email?.split('@')[0] || 'user',
    avatar_url: user.avatar_url || null,
    verified: user.verified || false
  };
};

export const validateMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    new URL(url.trim());
    return true;
  } catch {
    return false;
  }
};

export const sanitizeHtml = (html) => {
  if (!html || typeof html !== 'string') return '';
  
  // Basic XSS prevention
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};