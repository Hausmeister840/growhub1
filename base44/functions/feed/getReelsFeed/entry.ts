import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { fetchUsersForPosts } from '../../_shared/batchUsers.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);

    const mediaPosts = await base44.asServiceRole.entities.Post.filter(
      { status: 'published' }, '-created_date', 50
    ).catch(() => []);

    // Filter to only posts that actually have media
    const withMedia = (mediaPosts || []).filter(p => p?.id && p.media_urls?.length > 0);

    const userRows = await fetchUsersForPosts(base44, withMedia, { serviceRole: true });

    // Build compact user map (nur Autoren der geladenen Posts)
    const userMap = {};
    for (const u of userRows.values()) {
      if (!u?.id) continue;
      const d = (u.data && typeof u.data === 'object') ? u.data : {};
      const email = u.email || '';
      const ud = {
        id: u.id, email,
        full_name: u.full_name || d.full_name || '',
        username: d.username || u.username || (email ? email.split('@')[0] : 'user'),
        avatar_url: d.avatar_url || u.avatar_url || null,
        verified: d.verified || u.is_verified || false,
      };
      userMap[u.id] = ud;
      if (email) { userMap[email] = ud; userMap[email.toLowerCase()] = ud; }
    }

    return Response.json({
      posts: withMedia,
      users: userMap,
      currentUser: user ? {
        id: user.id, email: user.email,
        following: user.following || user.data?.following || [],
      } : null,
    });

  } catch (error) {
    console.error('getReelsFeed error:', error);
    return Response.json({ posts: [], users: {}, currentUser: null }, { status: 500 });
  }
});