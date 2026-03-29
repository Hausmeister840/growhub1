// ✅ Zentrale Data-Transformation Utilities

export function flattenPost(rawPost) {
  if (!rawPost) return null;
  
  // The API returns posts where entity fields (content, reactions, etc.)
  // are directly on the top-level object (not in rawPost.data).
  // rawPost.data is a legacy/internal structure - prefer top-level fields.
  const data = (rawPost.data && typeof rawPost.data === 'object') ? rawPost.data : {};
  
  // Helper: read from top-level first, then data as fallback
  const get = (key, fallback = null) => {
    if (rawPost[key] !== undefined && rawPost[key] !== null) return rawPost[key];
    if (data[key] !== undefined && data[key] !== null) return data[key];
    return fallback;
  };

  const mediaUrls = get('media_urls', []);

  return {
    id: rawPost.id,
    created_date: rawPost.created_date,
    updated_date: rawPost.updated_date,
    created_by: rawPost.created_by || data.created_by || '',
    created_by_id: rawPost.created_by_id || data.created_by_id || '',
    content: get('content', ''),
    status: get('status', 'published'),
    post_type: get('post_type', 'general'),
    type: get('type', 'text'),
    visibility: get('visibility', 'public'),
    category: get('category', 'general'),
    media_urls: Array.isArray(mediaUrls) ? mediaUrls : [],
    tags: Array.isArray(get('tags')) ? get('tags') : [],
    reactions: get('reactions') || {
      like: { count: 0, users: [] },
      fire: { count: 0, users: [] },
      laugh: { count: 0, users: [] },
      mind_blown: { count: 0, users: [] },
      helpful: { count: 0, users: [] },
      celebrate: { count: 0, users: [] }
    },
    comments_count: get('comments_count', 0),
    bookmarked_by_users: Array.isArray(get('bookmarked_by_users')) ? get('bookmarked_by_users') : [],
    engagement_score: get('engagement_score', 0),
    grow_diary_id: get('grow_diary_id', null),
    grow_entry_id: get('grow_entry_id', null),
    view_count: get('view_count', 0),
    share_count: get('share_count', 0),
    emotion: get('emotion', null),
    poll_data: get('poll_data', null),
  };
}

export function flattenPosts(rawPosts) {
  return (rawPosts || [])
    .map(flattenPost)
    .filter(p => p && p.id);
}

export function createUserMap(users) {
  const userMap = {};
  
  (users || []).forEach(user => {
    if (!user || !user.id) return;
    
    // IMPORTANT: In Base44, custom user fields (username, avatar_url, bio, etc.)
    // are stored in user.data, while built-in fields (id, email, full_name, role)
    // are at the top level.
    const data = (user.data && typeof user.data === 'object') ? user.data : {};
    
    const email = (user.email || '').toLowerCase();
    const username = data.username || user.username || email.split('@')[0] || 'user';
    const fullName = user.full_name || data.full_name || '';
    const avatarUrl = data.avatar_url || user.avatar_url || null;
    
    const userData = {
      id: user.id,
      email: user.email || email,
      username: username,
      full_name: fullName,
      avatar_url: avatarUrl,
      bio: data.bio || '',
      verified: data.verified || user.is_verified || false,
      role: user.role,
      followers_count: data.followers_count || 0,
    };

    // Map by email (lowercase) AND by user id
    if (email) userMap[email] = userData;
    if (user.email) userMap[user.email] = userData; // preserve original case too
    userMap[user.id] = userData;
  });

  return userMap;
}

export function getUserInitials(fullName, email) {
  if (fullName && fullName !== 'Unknown User' && fullName !== 'User') {
    const parts = fullName.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  if (email) return email.charAt(0).toUpperCase();
  return '?';
}

export function getUserColor(email) {
  if (!email) return '#10B981';
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16', '#F97316'];
  return colors[Math.abs(hash) % colors.length];
}