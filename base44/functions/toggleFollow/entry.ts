import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * 🔄 TOGGLE FOLLOW - STABILISIERT
 */

Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !user.id) {
      return Response.json({
        ok: false,
        error: 'Authentication required',
        message: 'Bitte melde dich an'
      }, { status: 401 });
    }

    const { targetUserId } = await req.clone().json();

    if (!targetUserId) {
      return Response.json({
        ok: false,
        error: 'Target user ID required',
        message: 'Benutzer-ID fehlt'
      }, { status: 400 });
    }

    if (targetUserId === user.id) {
      return Response.json({
        ok: false,
        error: 'Cannot follow yourself',
        message: 'Du kannst dir nicht selbst folgen'
      }, { status: 400 });
    }

    const targetUsers = await base44.asServiceRole.entities.User.filter({ id: targetUserId });
    const targetUser = targetUsers[0];

    if (!targetUser) {
      return Response.json({
        ok: false,
        error: 'Target user not found',
        message: 'Benutzer nicht gefunden'
      }, { status: 404 });
    }

    const currentUsers = await base44.asServiceRole.entities.User.filter({ id: user.id });
    const currentUser = currentUsers[0];

    if (!currentUser) {
      return Response.json({
        ok: false,
        error: 'Current user not found',
        message: 'Fehler beim Laden deines Profils'
      }, { status: 404 });
    }

    let currentUserFollowing = Array.isArray(currentUser.following) ? [...currentUser.following] : [];
    let targetUserFollowers = Array.isArray(targetUser.followers) ? [...targetUser.followers] : [];

    const isCurrentlyFollowing = currentUserFollowing.includes(targetUser.email);

    // Also check Follow entity
    const existingFollows = await base44.asServiceRole.entities.Follow.filter({
      follower_id: user.id,
      followee_id: targetUserId
    }).catch(() => []);
    const hasFollowRecord = existingFollows?.length > 0;

    if (isCurrentlyFollowing || hasFollowRecord) {
      currentUserFollowing = currentUserFollowing.filter(e => e !== targetUser.email);
      targetUserFollowers = targetUserFollowers.filter(e => e !== currentUser.email);
      // Delete Follow records
      for (const f of (existingFollows || [])) {
        await base44.asServiceRole.entities.Follow.delete(f.id).catch(() => {});
      }
    } else {
      if (!currentUserFollowing.includes(targetUser.email)) {
        currentUserFollowing.push(targetUser.email);
      }
      if (!targetUserFollowers.includes(currentUser.email)) {
        targetUserFollowers.push(currentUser.email);
      }
      // Create Follow record
      await base44.asServiceRole.entities.Follow.create({
        follower_id: user.id,
        follower_email: currentUser.email,
        followee_id: targetUserId,
        followee_email: targetUser.email,
        status: 'active',
        weight: 1.0
      }).catch(() => {});

      // Create notification for the followed user
      try {
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: targetUser.email,
          sender_email: currentUser.email,
          sender_id: user.id,
          type: 'follow',
          message: `${currentUser.full_name || currentUser.username || 'Jemand'} folgt dir jetzt 🌱`,
          read: false
        });
      } catch (notifErr) {
        console.warn('Follow notification failed (non-critical):', notifErr.message);
      }
    }

    await Promise.all([
      base44.asServiceRole.entities.User.update(currentUser.id, {
        following: currentUserFollowing,
        following_count: currentUserFollowing.length
      }),
      base44.asServiceRole.entities.User.update(targetUser.id, {
        followers: targetUserFollowers,
        followers_count: targetUserFollowers.length
      })
    ]);

    const duration = Date.now() - startTime;
    console.log(`✅ toggleFollow: Success in ${duration}ms`);

    return Response.json({
      ok: true,
      success: true,
      following: !isCurrentlyFollowing,
      data: {
        following: !isCurrentlyFollowing,
        follower_count: targetUserFollowers.length,
        following_count: currentUserFollowing.length
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ toggleFollow error after ${duration}ms:`, error);

    return Response.json({
      ok: false,
      error: error.message || 'Internal server error',
      message: 'Ein Fehler ist aufgetreten'
    }, { status: 500 });
  }
});