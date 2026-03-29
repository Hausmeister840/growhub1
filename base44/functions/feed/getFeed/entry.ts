import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { fetchUsersForPosts } from '../../_shared/batchUsers.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Optional auth
    let currentUser = null;
    try {
      currentUser = await base44.auth.me();
    } catch (e) {
      // Not logged in - that's ok
    }

    const url = new URL(req.url);
    const tab = url.searchParams.get('tab') || 'latest';
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10));
    const limit = Math.min(60, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
    const fetchCap = Math.min(offset + limit, 100);

    let posts = [];

    if (tab === 'for_you' && currentUser) {
      const interests = currentUser.interests || [];
      if (interests.length > 0) {
        posts = await base44.entities.Post.filter(
          { tags: { $in: interests } },
          '-created_date',
          fetchCap
        );
      } else {
        posts = await base44.entities.Post.list('-created_date', fetchCap);
      }
    } else if (tab === 'following' && currentUser) {
      const following = currentUser.following || [];
      if (following.length > 0) {
        posts = await base44.entities.Post.filter(
          { created_by: { $in: following } },
          '-created_date',
          fetchCap
        );
      }
    } else if (tab === 'trending') {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      posts = await base44.entities.Post.filter(
        { created_date: { $gte: oneDayAgo } },
        '-created_date',
        fetchCap
      );

      posts.sort((a, b) => {
        const aScore = Object.values(a.reactions || {}).reduce((sum, r) => sum + (r.count || 0), 0);
        const bScore = Object.values(b.reactions || {}).reduce((sum, r) => sum + (r.count || 0), 0);
        return bScore - aScore;
      });
    } else if (tab === 'videos') {
      posts = await base44.entities.Post.filter(
        { type: 'video' },
        '-created_date',
        fetchCap
      );
    } else {
      posts = await base44.entities.Post.list('-created_date', fetchCap);
    }

    const rawBatch = posts || [];
    const pagePosts = rawBatch.slice(offset, offset + limit);
    const hasMore = rawBatch.length >= fetchCap;

    const userMapById = await fetchUsersForPosts(base44, pagePosts, { serviceRole: true });

    const usersMap = {};
    for (const u of userMapById.values()) {
      if (u?.email) {
        usersMap[u.email] = u;
      }
    }

    return Response.json({ 
      ok: true, 
      data: {
        posts: pagePosts,
        users: usersMap
      },
      meta: {
        offset,
        limit,
        hasMore
      }
    });

  } catch (error) {
    console.error('Feed error:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});
