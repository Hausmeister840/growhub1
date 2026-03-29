
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * 👥 GET FOLLOWERS LIST - PRODUCTION READY
 */

Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    const base44 = createClientFromRequest(req);
    
    let currentUser = null;
    try {
      currentUser = await base44.auth.me();
    } catch {
      console.log('📭 No authenticated user');
    }

    const { user_id, type = 'followers', cursor = null, limit = 20 } = await req.json();

    if (!user_id) {
      return Response.json({
        ok: false,
        error: 'user_id required',
        message: 'Benutzer-ID fehlt'
      }, { status: 400 });
    }

    if (!['followers', 'following'].includes(type)) {
      return Response.json({
        ok: false,
        error: 'Invalid type',
        message: 'Ungültiger Typ'
      }, { status: 400 });
    }

    console.log('👥 Loading followers list:', { user_id, type, cursor, limit });

    // Load target user
    const targetUsers = await base44.asServiceRole.entities.User.filter({ id: user_id });
    
    if (targetUsers.length === 0) {
      return Response.json({
        ok: false,
        error: 'User not found',
        message: 'Benutzer nicht gefunden'
      }, { status: 404 });
    }

    const targetUser = targetUsers[0];
    
    // Get list of unique emails from followers/following
    const rawEmails = type === 'followers' 
      ? (targetUser.followers || [])
      : (targetUser.following || []);
    const emails = [...new Set(rawEmails)]; // Ensure uniqueness

    // Pagination
    const offset = cursor ? parseInt(cursor) : 0;
    const paginatedEmails = emails.slice(offset, offset + limit);

    // Load users
    const users = [];
    
    for (const email of paginatedEmails) {
      try {
        const userResults = await base44.asServiceRole.entities.User.filter({ email });
        if (userResults.length > 0) {
          const user = userResults[0];
          
          // Check if current user follows this user
          let is_following = false;
          if (currentUser) {
            is_following = user.followers?.includes(currentUser.email) || false;
          }
          
          users.push({
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            username: user.username || user.full_name,
            avatar_url: user.avatar_url,
            bio: user.bio,
            verified: user.verified || false,
            grow_level: user.grow_level || 'beginner',
            followers_count: user.followers_count || 0,
            is_following
          });
        }
      } catch (error) {
        console.warn('⚠️ Error loading user:', email, error);
      }
    }

    const hasMore = offset + limit < emails.length;
    const nextCursor = hasMore ? String(offset + limit) : null;

    const duration = Date.now() - startTime;
    console.log(`✅ Followers list loaded in ${duration}ms`);

    return Response.json({
      ok: true,
      data: {
        users,
        next_cursor: nextCursor,
        has_more: hasMore,
        total: emails.length
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Followers list error after ${duration}ms:`, error);

    return Response.json({
      ok: false,
      error: error.message || 'Internal error',
      message: 'Ein Fehler ist aufgetreten'
    }, { status: 500 });
  }
});
