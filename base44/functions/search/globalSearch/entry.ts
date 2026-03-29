import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query } = await req.json();
    const trimmed = (query || '').trim().toLowerCase();

    if (!trimmed || trimmed.length < 2) {
      return Response.json({ posts: [], users: [], tags: [] });
    }

    // Fetch data server-side with service role
    const [posts, users] = await Promise.all([
      base44.asServiceRole.entities.Post.filter({ status: 'published' }, '-created_date', 100),
      base44.asServiceRole.entities.User.list('-created_date', 200),
    ]);

    // Extract matching tags
    const tagSet = new Set();
    posts.forEach(p => {
      (p.tags || []).forEach(t => {
        if (t.toLowerCase().includes(trimmed)) tagSet.add(t);
      });
    });

    // Match posts by content or tags
    const matchedPosts = posts.filter(p => {
      const contentMatch = (p.content || '').toLowerCase().includes(trimmed);
      const tagMatch = (p.tags || []).some(t => t.toLowerCase().includes(trimmed));
      return contentMatch || tagMatch;
    }).slice(0, 8).map(p => ({
      id: p.id,
      content: (p.content || '').slice(0, 150),
      tags: (p.tags || []).slice(0, 4),
      media_urls: (p.media_urls || []).slice(0, 1),
      created_date: p.created_date,
      created_by: p.created_by,
    }));

    // Match users by name, username, or email
    const matchedUsers = users.filter(u => {
      const name = (u.full_name || '').toLowerCase();
      const username = (u.username || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      return name.includes(trimmed) || username.includes(trimmed) || email.split('@')[0].includes(trimmed);
    }).slice(0, 6).map(u => ({
      id: u.id,
      full_name: u.full_name,
      username: u.username,
      avatar_url: u.avatar_url,
      email: u.email,
    }));

    return Response.json({
      posts: matchedPosts,
      users: matchedUsers,
      tags: [...tagSet].slice(0, 10),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});