import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * 👤 GET PROFILE - SINGLE SOURCE
 */

function normalizeUser(user) {
  if (!user) return null;

  const data = user.data && typeof user.data === 'object' ? user.data : {};
  const email = user.email || '';
  const prefix = email ? email.split('@')[0] : '';
  const followers = Array.isArray(data.followers || user.followers) ? (data.followers || user.followers) : [];
  const following = Array.isArray(data.following || user.following) ? (data.following || user.following) : [];
  const username = data.username || user.username || prefix;

  return {
    ...data,
    ...user,
    id: user.id,
    email,
    full_name: user.full_name || data.full_name || prefix || 'User',
    username,
    handle: data.handle || user.handle || (username ? `@${username}` : null),
    avatar_url: data.avatar_url || user.avatar_url || null,
    banner_url: data.banner_url || user.banner_url || null,
    bio: data.bio || user.bio || '',
    followers,
    following,
    followers_count: data.followers_count || user.followers_count || followers.length,
    following_count: data.following_count || user.following_count || following.length,
    xp: data.xp || user.xp || 0,
    reputation_score: data.reputation_score || user.reputation_score || 0,
    privacy_mode: data.privacy_mode || user.privacy_mode || 'public',
  };
}

async function findTargetUser(base44, targetParam) {
  if (targetParam.includes('@') && !targetParam.startsWith('@')) {
    const users = await base44.asServiceRole.entities.User.filter({ email: targetParam });
    return users[0] || null;
  }

  if (!targetParam.startsWith('@')) {
    const byId = await base44.asServiceRole.entities.User.filter({ id: targetParam });
    if (byId.length > 0) {
      return byId[0];
    }
  }

  const normalizedTarget = targetParam.toLowerCase();
  const recentUsers = await base44.asServiceRole.entities.User.list('-created_date', 300);

  return (recentUsers || []).find((candidate) => {
    const normalizedUser = normalizeUser(candidate);
    if (!normalizedUser) return false;

    const username = typeof normalizedUser.username === 'string' ? normalizedUser.username.toLowerCase() : '';
    const handle = typeof normalizedUser.handle === 'string' ? normalizedUser.handle.toLowerCase() : '';

    if (targetParam.startsWith('@')) {
      return handle === normalizedTarget || username === normalizedTarget.slice(1);
    }

    return username === normalizedTarget || handle === `@${normalizedTarget}`;
  }) || null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let targetParam = null;
    try {
      const body = await req.json();
      targetParam = body?.target || body?.id || body?.email || body?.username;
    } catch {
      const url = new URL(req.url);
      targetParam = url.searchParams.get('target') || url.searchParams.get('id');
    }

    if (!targetParam) {
      return Response.json({ ok: false, error: 'Target parameter required' }, { status: 400 });
    }

    const targetUser = await findTargetUser(base44, targetParam);

    if (!targetUser) {
      return Response.json({ ok: false, error: 'User not found' }, { status: 404 });
    }

    const normalizedTargetUser = normalizeUser(targetUser);
    const requester = await base44.auth.me().catch(() => null);

    let isOwnProfile = false;
    let isFollowing = false;

    if (requester) {
      isOwnProfile = requester.id === normalizedTargetUser.id;

      if (!isOwnProfile) {
        const follows = await base44.asServiceRole.entities.Follow.filter({
          follower_id: requester.id,
          followee_id: normalizedTargetUser.id,
          status: 'active',
        }).catch(() => []);

        isFollowing = (follows || []).length > 0;
      }
    }

    const [posts, diaries] = await Promise.all([
      base44.asServiceRole.entities.Post.filter({ created_by: normalizedTargetUser.email }, '-created_date', 200).catch(() => []),
      base44.asServiceRole.entities.GrowDiary.filter({ created_by: normalizedTargetUser.email }, '-created_date', 100).catch(() => []),
    ]);

    const stats = {
      posts: (posts || []).length,
      followers: normalizedTargetUser.followers_count || normalizedTargetUser.followers?.length || 0,
      following: normalizedTargetUser.following_count || normalizedTargetUser.following?.length || 0,
      xp: normalizedTargetUser.xp || 0,
      reputation: normalizedTargetUser.reputation_score || 0,
      diaries: (diaries || []).length,
    };

    return Response.json({
      ok: true,
      user: {
        ...normalizedTargetUser,
        posts_count: stats.posts,
        followers_count: stats.followers,
        following_count: stats.following,
        diaries_count: stats.diaries,
      },
      stats,
      is_own_profile: isOwnProfile,
      is_following: isFollowing,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});
