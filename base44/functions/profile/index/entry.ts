import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'get';

    // GET Profile
    if (action === 'get') {
      const targetEmail = url.searchParams.get('email') || user.email;
      
      const profiles = await base44.entities.User.filter({ email: targetEmail });
      const profile = profiles[0];

      if (!profile) {
        return Response.json({ error: 'Profile not found' }, { status: 404 });
      }

      return Response.json({ ok: true, data: profile });
    }

    // UPDATE Profile
    if (action === 'update') {
      const body = await req.json();
      
      await base44.entities.User.update(user.id, body);
      
      const updated = await base44.entities.User.filter({ id: user.id });

      return Response.json({ ok: true, data: updated[0] });
    }

    // TOGGLE Follow
    if (action === 'toggleFollow') {
      const targetEmail = url.searchParams.get('targetEmail');
      
      if (!targetEmail) {
        return Response.json({ error: 'targetEmail required' }, { status: 400 });
      }

      const targetUsers = await base44.entities.User.filter({ email: targetEmail });
      const targetUser = targetUsers[0];

      if (!targetUser) {
        return Response.json({ error: 'User not found' }, { status: 404 });
      }

      const currentFollowing = user.following || [];
      const isFollowing = currentFollowing.includes(targetEmail);

      const newFollowing = isFollowing
        ? currentFollowing.filter(e => e !== targetEmail)
        : [...currentFollowing, targetEmail];

      await base44.entities.User.update(user.id, { following: newFollowing });

      const targetFollowers = targetUser.followers || [];
      const newFollowers = isFollowing
        ? targetFollowers.filter(e => e !== user.email)
        : [...targetFollowers, user.email];

      await base44.entities.User.update(targetUser.id, { followers: newFollowers });

      return Response.json({ 
        ok: true, 
        data: { isFollowing: !isFollowing } 
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Profile function error:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});