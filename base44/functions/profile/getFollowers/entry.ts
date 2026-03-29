import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const type = url.searchParams.get('type') || 'followers'; // 'followers' or 'following'

    if (!userId) {
      return Response.json({ error: 'Missing userId' }, { status: 400 });
    }

    const targetUser = await base44.entities.User.get(userId);
    if (!targetUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const emails = type === 'followers' 
      ? (targetUser.followers || [])
      : (targetUser.following || []);

    if (emails.length === 0) {
      return Response.json({ users: [] });
    }

    // Get all users
    const allUsers = await base44.entities.User.list('-created_date', 500);
    
    // Filter to requested emails
    const users = allUsers.filter(u => emails.includes(u.email));

    return Response.json({ users });

  } catch (error) {
    console.error('Get followers error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});