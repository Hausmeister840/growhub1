import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { fetchUsersForPosts } from '../../_shared/batchUsers.ts';

function ensureArray(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string' && val.length > 0) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Ignore malformed payloads and fall back below.
    }
  }
  if (val && typeof val === 'object') {
    for (const key of ['items', 'data', 'results']) {
      if (Array.isArray(val[key])) return val[key];
    }
  }
  return [];
}

function normalizeLimit(value, fallback = 40) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(60, Math.max(10, Math.round(parsed)));
}

function normalizeOffset(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(300, Math.max(0, Math.round(parsed)));
}

function normalizeUser(user) {
  if (!user?.id) return null;

  const data = user.data && typeof user.data === 'object' ? user.data : {};
  const email = user.email || '';
  const prefix = email ? email.split('@')[0] : '';

  return {
    id: user.id,
    email,
    full_name: user.full_name || data.full_name || prefix || 'User',
    username: data.username || user.username || prefix || 'user',
    avatar_url: data.avatar_url || user.avatar_url || null,
    verified: Boolean(data.verified || user.is_verified),
  };
}

Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    const body = await req.clone().json().catch(() => ({}));
    const base44 = createClientFromRequest(req);
    const tab = ['all', 'trending', 'following'].includes(body.tab) ? body.tab : 'all';
    const limit = normalizeLimit(body.limit);
    const offset = normalizeOffset(body.offset);
    const postFetchLimit = Math.min(Math.max((offset + limit) * 3, 60), 360);

    const rawPosts = await base44.asServiceRole.entities.Post
      .list('-created_date', postFetchLimit)
      .catch(() => []);

    const posts = ensureArray(rawPosts).filter((post) => post && post.id && post.status === 'published');

    if (!posts.length) {
      return Response.json({ posts: [], users: {}, hasMore: false });
    }

    const user = await base44.auth.me().catch(() => null);
    let follows = [];
    const legacyFollowingEmails = [];

    if (user?.email && (tab === 'all' || tab === 'following')) {
      const rawFollows = await base44.asServiceRole.entities.Follow
        .filter({ follower_email: user.email, status: 'active' })
        .catch(() => []);
      follows = ensureArray(rawFollows);

      const userData = user.data || user;
      const legacyList = userData.following;
      if (Array.isArray(legacyList)) {
        for (const email of legacyList) {
          if (email && typeof email === 'string') {
            legacyFollowingEmails.push(email.toLowerCase());
          }
        }
      }
    }

    const followedEmails = new Set([
      ...follows.map((follow) => follow.followee_email?.toLowerCase()).filter(Boolean),
      ...legacyFollowingEmails,
    ]);
    const now = Date.now();

    const scored = posts.map((post) => {
      const ageHours = Math.max(0.5, (now - new Date(post.created_date || now).getTime()) / 3600000);
      const reactions = post.reactions || {};
      let totalReactions = 0;
      let reactionTypes = 0;

      for (const key in reactions) {
        const count = reactions[key]?.count || 0;
        if (count > 0) {
          totalReactions += count;
          reactionTypes++;
        }
      }

      const comments = post.comments_count || 0;
      const bookmarks = Array.isArray(post.bookmarked_by_users) ? post.bookmarked_by_users.length : 0;
      const engagement = totalReactions * 1.5 + comments * 3 + bookmarks * 2;
      const velocity = engagement / ageHours;
      const decay = Math.exp(-0.693 * ageHours / 24);
      const diversity = 1 + Math.min(reactionTypes, 4) * 0.08;
      const media = Array.isArray(post.media_urls) ? post.media_urls : [];
      const mediaBonus = media.length > 0
        ? (media.some((url) => /\.(mp4|webm|mov)$/i.test(url)) ? 1.3 : 1.15)
        : 1;
      const authorEmail = typeof post.created_by === 'string' ? post.created_by.toLowerCase() : '';
      const isFollowed = authorEmail ? followedEmails.has(authorEmail) : false;

      let score;
      if (tab === 'trending') {
        score = ageHours > 168 ? -1 : (velocity * 8 + engagement * 0.3) * diversity * mediaBonus * decay;
      } else if (tab === 'following') {
        score = !isFollowed ? -1 : decay * 100 + engagement * 0.5;
      } else {
        score = (engagement * 0.4 + velocity * 3 + decay * 30 + (isFollowed ? 20 : 0)) * diversity * mediaBonus;
      }

      return { post, score };
    });

    const sorted = scored
      .filter((entry) => entry.score >= 0)
      .sort((left, right) => right.score - left.score);

    const paged = sorted.slice(offset, offset + limit);

    const authorPosts = paged.map(({ post }) => post);
    const userRows = await fetchUsersForPosts(base44, authorPosts, { serviceRole: true });

    const relevantUsers = {};
    for (const row of userRows.values()) {
      const author = normalizeUser(row);
      if (!author) continue;
      relevantUsers[author.id] = author;
      if (author.email) {
        relevantUsers[author.email] = author;
        relevantUsers[author.email.toLowerCase()] = author;
      }
    }

    const resultPosts = paged.map(({ post }) => post);
    const nextOffset = offset + resultPosts.length;

    console.log(`Smart feed [${tab}]: ${resultPosts.length} posts, ${Date.now() - startTime}ms`);
    return Response.json({
      posts: resultPosts,
      users: relevantUsers,
      hasMore: nextOffset < sorted.length,
      nextOffset,
    });
  } catch (error) {
    console.error('getSmartFeed error:', error);
    return Response.json({ posts: [], users: {}, hasMore: false, error: error.message }, { status: 500 });
  }
});
