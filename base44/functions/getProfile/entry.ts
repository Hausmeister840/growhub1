import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * 👤 GET PROFILE - FIXED PRIVACY CHECK
 * Lädt vollständiges User-Profil mit korrekter Privacy-Logik
 */

Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    const base44 = createClientFromRequest(req);
    
    // Get current user (optional)
    let currentUser = null;
    try {
      currentUser = await base44.auth.me();
    } catch {
      console.log('📭 No authenticated user');
    }

    const { user_id, user_email } = await req.json();

    if (!user_id && !user_email) {
      return Response.json({
        ok: false,
        error: 'user_id or user_email required',
        message: 'Benutzer-ID oder Email fehlt'
      }, { status: 400 });
    }

    console.log('👤 Loading profile:', { user_id, user_email });

    // ✅ Try to find user
    let targetUser = null;
    
    try {
      if (user_id) {
        const allUsers = await base44.asServiceRole.entities.User.list();
        targetUser = allUsers.find(u => u.id === user_id);
        
        if (!targetUser) {
          console.log('❌ No user found with ID:', user_id);
          
          return Response.json({
            ok: false,
            error: 'User not found',
            message: 'Profil nicht gefunden',
            details: 'Kein Benutzer mit dieser ID gefunden.',
            hint: 'Bitte überprüfe den Link oder kehre zur Startseite zurück.'
          }, { status: 404 });
        }
        
        console.log('✅ User found by ID:', targetUser.email);
        
      } else if (user_email) {
        const users = await base44.asServiceRole.entities.User.filter({ 
          email: user_email 
        });
        
        if (users.length === 0) {
          return Response.json({
            ok: false,
            error: 'User not found',
            message: 'Benutzer nicht gefunden',
            details: 'Kein Benutzer mit dieser Email gefunden.'
          }, { status: 404 });
        }
        
        targetUser = users[0];
        console.log('✅ User found by email:', targetUser.email);
      }

    } catch (error) {
      console.error('❌ Database error:', error);
      return Response.json({
        ok: false,
        error: 'Database error',
        message: 'Datenbankfehler',
        details: error.message
      }, { status: 500 });
    }

    if (!targetUser) {
      return Response.json({
        ok: false,
        error: 'User not found',
        message: 'Benutzer nicht gefunden'
      }, { status: 404 });
    }

    // ✅ FIXED: Check privacy with proper defaults
    const privacyMode = targetUser.privacy_mode || 'public'; // Default to public if not set
    
    const canView = 
      privacyMode === 'public' ||
      (currentUser && currentUser.id === targetUser.id) ||
      (currentUser && privacyMode === 'followers' && 
       targetUser.followers && targetUser.followers.includes(currentUser.email));

    console.log('🔒 Privacy check:', {
      privacyMode,
      isOwnProfile: currentUser?.id === targetUser.id,
      isFollower: currentUser ? targetUser.followers?.includes(currentUser.email) : false,
      canView
    });

    if (!canView) {
      return Response.json({
        ok: false,
        error: 'Private profile',
        message: 'Dieses Profil ist privat',
        details: privacyMode === 'followers' 
          ? 'Du musst diesem Nutzer folgen, um sein Profil zu sehen.'
          : 'Dieses Profil ist nur für den Besitzer sichtbar.'
      }, { status: 403 });
    }

    // ✅ Load posts count
    let postsCount = 0;
    try {
      const posts = await base44.asServiceRole.entities.Post.filter(
        { created_by: targetUser.email }
      );
      postsCount = posts.length;
    } catch (error) {
      console.warn('⚠️ Error loading posts count:', error);
    }

    // ✅ Load grow diaries count
    let diariesCount = 0;
    try {
      const diaries = await base44.asServiceRole.entities.GrowDiary.filter(
        { created_by: targetUser.email }
      );
      diariesCount = diaries.length;
    } catch (error) {
      console.warn('⚠️ Error loading diaries count:', error);
    }

    // ✅ Calculate stats
    const stats = {
      posts: postsCount,
      diaries: diariesCount,
      followers: targetUser.followers_count || (targetUser.followers?.length || 0),
      following: targetUser.following_count || (targetUser.following?.length || 0),
      xp: targetUser.xp || 0,
      level: Math.floor((targetUser.xp || 0) / 100) + 1,
      reputation: targetUser.reputation_score || 0,
      total_grows: diariesCount,
      completed_grows: 0
    };

    // ✅ Check if following
    let isFollowing = false;
    if (currentUser && currentUser.id !== targetUser.id) {
      isFollowing = targetUser.followers?.includes(currentUser.email) || false;
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Profile loaded in ${duration}ms`);

    return Response.json({
      ok: true,
      data: {
        user: {
          id: targetUser.id,
          email: targetUser.email,
          full_name: targetUser.full_name,
          username: targetUser.username || targetUser.full_name,
          handle: targetUser.handle || targetUser.username,
          bio: targetUser.bio || '',
          avatar_url: targetUser.avatar_url,
          banner_url: targetUser.banner_url,
          location: targetUser.location,
          website_url: targetUser.website_url,
          links: targetUser.links || [],
          grow_level: targetUser.grow_level || 'beginner',
          verified: targetUser.verified || false,
          privacy_mode: privacyMode,
          interests: targetUser.interests || [],
          badges: targetUser.badges || [],
          xp: targetUser.xp || 0,
          created_date: targetUser.created_date
        },
        stats,
        is_following: isFollowing,
        can_edit: currentUser && currentUser.id === targetUser.id,
        is_own_profile: currentUser && currentUser.id === targetUser.id
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Profile load error after ${duration}ms:`, error);

    return Response.json({
      ok: false,
      error: 'Internal error',
      message: 'Interner Fehler',
      details: error.message
    }, { status: 500 });
  }
});