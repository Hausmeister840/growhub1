import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const normalizeUser = (user) => {
  const data = user?.data || {};
  const email = user?.email || '';
  const username = data.username || user?.username || (email ? email.split('@')[0] : 'user');

  return {
    id: user?.id || '',
    email,
    full_name: user?.full_name || data.full_name || username,
    username,
    handle: data.handle || user?.handle || (username ? `@${username}` : ''),
    avatar_url: data.avatar_url || user?.avatar_url || null,
    bio: data.bio || user?.bio || '',
    verified: data.verified || user?.is_verified || false,
    role: user?.role || data.role || 'user',
    location: data.location || user?.location || '',
    website_url: data.website_url || user?.website_url || '',
    created_date: user?.created_date || null,
  };
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    await base44.auth.me().catch(() => null);

    const body = await req.json().catch(() => ({}));
    const emails = [...new Set((body.emails || []).filter(Boolean))];
    const ids = [...new Set((body.ids || []).filter(Boolean))];
    const includeAll = Boolean(body.include_all);
    const limit = Math.min(Math.max(Number(body.limit || 100), 1), 500);

    let rawUsers = [];

    if (includeAll) {
      rawUsers = await base44.asServiceRole.entities.User.list('-created_date', limit).catch(() => []);
    } else {
      const [usersByEmail, usersById] = await Promise.all([
        Promise.all(emails.map((email) => base44.asServiceRole.entities.User.filter({ email }).catch(() => []))),
        Promise.all(ids.map((id) => base44.asServiceRole.entities.User.filter({ id }).catch(() => []))),
      ]);
      rawUsers = [...usersByEmail.flat(), ...usersById.flat()];
    }

    const uniqueUsers = rawUsers.filter((user, index, arr) =>
      user?.id && arr.findIndex((candidate) => candidate?.id === user.id) === index
    );

    const users = uniqueUsers.map(normalizeUser);
    const map = {};

    users.forEach((user) => {
      if (!user?.id) return;
      map[user.id] = user;
      if (user.email) {
        map[user.email] = user;
        map[user.email.toLowerCase()] = user;
      }
    });

    return Response.json({ success: true, users, map });
  } catch (error) {
    console.error('resolveUsers error:', error);
    return Response.json({ success: false, error: error.message, users: [], map: {} }, { status: 500 });
  }
});