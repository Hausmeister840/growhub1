import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { fetchUsersForPosts } from '../../_shared/batchUsers.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    await base44.auth.me().catch(() => null);
    
    const body = await req.json().catch(() => ({}));
    const limitRaw = Number(body.limit);
    const offsetRaw = Number(body.offset);
    const take = Math.min(Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 30, 30);
    const off = Math.max(0, Number.isFinite(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0);
    const fetchCap = Math.min(off + take, 200);

    // Fetch published posts — use filter to only get published ones
    const posts = await base44.asServiceRole.entities.Post.filter(
      { status: 'published' },
      '-created_date',
      fetchCap
    ).catch(() => []);

    const rawFiltered = (posts || []).filter(p => p && p.id);
    const filteredPosts = rawFiltered.slice(off, off + take);

    if (filteredPosts.length === 0) {
      return Response.json({ success: true, posts: [], users: {}, hasMore: false });
    }

    const userMapById = await fetchUsersForPosts(base44, filteredPosts, { serviceRole: true });

    const users = {};
    for (const u of userMapById.values()) {
      if (!u || !u.id) continue;

      const data = u.data || {};
      const email = u.email || '';
      const lowercaseEmail = email.toLowerCase();
      const username = data.username || u.username || (email ? email.split('@')[0] : 'user');

      const userData = {
        id: u.id,
        email,
        full_name: u.full_name || data.full_name || username,
        username,
        avatar_url: u.avatar_url || data.avatar_url || null,
        bio: data.bio || u.bio || '',
        verified: data.verified || u.is_verified || false,
        role: u.role,
        followers_count: data.followers_count || 0,
      };

      users[u.id] = userData;
      if (email) {
        users[email] = userData;
        users[lowercaseEmail] = userData;
      }
    }

    // Enrich posts: ensure created_by (email) is always set from created_by_id lookup
    const enrichedPosts = filteredPosts.map((post) => {
      const authorByEmail = post.created_by ? (users[post.created_by] || users[post.created_by.toLowerCase()]) : null;
      const authorById = post.created_by_id ? users[post.created_by_id] : null;
      const author = authorByEmail || authorById;
      return {
        ...post,
        created_by: post.created_by || author?.email || '',
        created_by_id: post.created_by_id || author?.id || '',
      };
    });

    return Response.json({
      success: true,
      posts: enrichedPosts,
      users,
      hasMore: rawFiltered.length >= fetchCap
    });

  } catch (error) {
    console.error('getOptimizedFeed error:', error);
    return Response.json({
      success: false,
      error: error.message,
      posts: [],
      users: {},
      hasMore: false
    }, { status: 500 });
  }
});