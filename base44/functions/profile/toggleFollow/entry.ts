import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetUserId } = await req.json();

    if (!targetUserId || targetUserId === user.id) {
      return Response.json({ error: 'Invalid target user' }, { status: 400 });
    }

    // Get both users
    const [currentUserData, targetUser] = await Promise.all([
      base44.asServiceRole.entities.User.get(user.id),
      base44.asServiceRole.entities.User.get(targetUserId)
    ]);

    if (!targetUser) {
      return Response.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Toggle follow
    const currentFollowing = currentUserData.following || [];
    const targetFollowers = targetUser.followers || [];
    const isFollowing = currentFollowing.includes(targetUser.email);

    let updatedFollowing, updatedFollowers;

    if (isFollowing) {
      // Unfollow
      updatedFollowing = currentFollowing.filter(e => e !== targetUser.email);
      updatedFollowers = targetFollowers.filter(e => e !== user.email);
    } else {
      // Follow
      updatedFollowing = [...currentFollowing, targetUser.email];
      updatedFollowers = [...targetFollowers, user.email];

      // Create notification
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: targetUser.email,
        sender_email: user.email,
        sender_id: user.id,
        type: 'follow',
        message: `${user.full_name || user.username} folgt dir jetzt`,
        read: false
      });
    }

    // Update both users
    await Promise.all([
      base44.asServiceRole.entities.User.update(user.id, {
        following: updatedFollowing,
        following_count: updatedFollowing.length
      }),
      base44.asServiceRole.entities.User.update(targetUser.id, {
        followers: updatedFollowers,
        followers_count: updatedFollowers.length
      })
    ]);

    return Response.json({
      success: true,
      isFollowing: !isFollowing,
      followingCount: updatedFollowing.length,
      followersCount: updatedFollowers.length
    });

  } catch (error) {
    console.error('Toggle follow error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});