import { createClientFromRequest } from 'npm:@base44/sdk@0.7.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({
        ok: false,
        error: 'authentication_required'
      }, { status: 401 });
    }

    const { target_user_id } = await req.json();

    if (!target_user_id || target_user_id === user.id) {
      return Response.json({
        ok: false,
        error: 'invalid_target_user'
      }, { status: 400 });
    }

    console.log(`🔄 Toggle follow: ${user.id} -> ${target_user_id}`);

    // Check if follow relationship already exists
    const existingFollows = await base44.entities.Follow.filter({
      follower_id: user.id,
      following_id: target_user_id
    });

    let isFollowing = false;

    if (existingFollows.length > 0) {
      // Unfollow
      await base44.entities.Follow.delete(existingFollows[0].id);
      
      // Decrement follower's following count
      await base44.entities.User.update(user.id, {}, {
        increment: { stats_following: -1 }
      });
      
      // Decrement target's followers count
      await base44.entities.User.update(target_user_id, {}, {
        increment: { stats_followers: -1 }
      });

      console.log(`➖ Unfollowed user ${target_user_id}`);
    } else {
      // Follow
      await base44.entities.Follow.create({
        follower_id: user.id,
        following_id: target_user_id,
        status: 'active'
      });

      // Increment follower's following count
      await base44.entities.User.update(user.id, {}, {
        increment: { stats_following: 1 }
      });
      
      // Increment target's followers count
      await base44.entities.User.update(target_user_id, {}, {
        increment: { stats_followers: 1 }
      });

      isFollowing = true;
      console.log(`➕ Followed user ${target_user_id}`);
    }

    return Response.json({
      ok: true,
      target_user_id,
      is_following: isFollowing,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Follow user error:', error);
    
    return Response.json({
      ok: false,
      error: 'follow_failed',
      message: error.message
    }, { status: 500 });
  }
});