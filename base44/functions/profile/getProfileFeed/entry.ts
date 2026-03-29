import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * 📰 GET PROFILE FEED - SINGLE SOURCE
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const userEmail = url.searchParams.get('userEmail');
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10));

    if (!userEmail) {
      return Response.json({ ok: false, error: 'User email required' }, { status: 400 });
    }

    const requester = await base44.auth.me().catch(() => null);
    const targetUsers = await base44.asServiceRole.entities.User.filter({ email: userEmail }, '-created_date', 1).catch(() => []);
    const targetUser = targetUsers?.[0] || null;
    if (!targetUser) {
      return Response.json({ ok: false, error: 'User not found' }, { status: 404 });
    }

    const isOwnProfile = !!requester && requester.email?.toLowerCase() === userEmail.toLowerCase();
    let canSeeFriends = false;
    if (requester && !isOwnProfile) {
      const follows = await base44.asServiceRole.entities.Follow.filter({
        follower_id: requester.id,
        followee_id: targetUser.id,
        status: 'active'
      }).catch(() => []);
      canSeeFriends = (follows || []).length > 0;
    }

    const rawPosts = await base44.asServiceRole.entities.Post.filter(
      { created_by: userEmail },
      '-created_date',
      Math.min(offset + limit, 200)
    ).catch(() => []);

    const visiblePosts = (rawPosts || []).filter((post) => {
      const visibility = post?.visibility || 'public';
      if (isOwnProfile) return true;
      if (visibility === 'public') return true;
      if (visibility === 'friends') return canSeeFriends;
      return false;
    });
    const pagePosts = visiblePosts.slice(offset, offset + limit);

    return Response.json({
      ok: true,
      posts: pagePosts,
      hasMore: visiblePosts.length > offset + limit,
      nextOffset: offset + pagePosts.length
    });

  } catch (error) {
    console.error('Get profile feed error:', error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});