import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * ❤️ UPDATE POST REACTION - FIXED 400 ERROR
 */

Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    const base44 = createClientFromRequest(req);
    
    // ✅ FIX: User Check
    let user;
    try {
      user = await base44.auth.me();
    } catch (authError) {
      console.error('❌ Auth error:', authError);
      return Response.json({
        ok: false,
        success: false,
        error: 'Authentication required',
        message: 'Bitte melde dich an'
      }, { status: 401 });
    }

    if (!user || !user.email) {
      return Response.json({
        ok: false,
        success: false,
        error: 'User email missing',
        message: 'Bitte melde dich an'
      }, { status: 401 });
    }

    // ✅ FIX: Parse JSON Body mit Error Handling
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      return Response.json({
        ok: false,
        success: false,
        error: 'Invalid JSON',
        message: 'Ungültige Anfrage'
      }, { status: 400 });
    }

    const { postId, reactionType } = body;

    // ✅ FIX: Validate Input
    if (!postId) {
      console.error('❌ Missing postId');
      return Response.json({
        ok: false,
        success: false,
        error: 'Post ID required',
        message: 'Post-ID fehlt'
      }, { status: 400 });
    }

    if (!reactionType) {
      console.error('❌ Missing reactionType');
      return Response.json({
        ok: false,
        success: false,
        error: 'Reaction type required',
        message: 'Reaktionstyp fehlt'
      }, { status: 400 });
    }

    const validReactions = ['like', 'fire', 'laugh', 'mind_blown', 'helpful', 'celebrate'];
    
    if (!validReactions.includes(reactionType)) {
      console.error('❌ Invalid reaction type:', reactionType);
      return Response.json({
        ok: false,
        success: false,
        error: 'Invalid reaction type',
        message: `Ungültiger Reaktionstyp. Erlaubt: ${validReactions.join(', ')}`
      }, { status: 400 });
    }

    console.log('❤️ Update reaction:', { postId, reactionType, user: user.email });

    // ✅ Load post with error handling
    let posts;
    try {
      posts = await base44.asServiceRole.entities.Post.filter({ id: postId });
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      return Response.json({
        ok: false,
        success: false,
        error: 'Database error',
        message: 'Fehler beim Laden des Posts'
      }, { status: 500 });
    }
    
    if (!posts || posts.length === 0) {
      console.error('❌ Post not found:', postId);
      return Response.json({
        ok: false,
        success: false,
        error: 'Post not found',
        message: 'Post nicht gefunden'
      }, { status: 404 });
    }

    const post = posts[0];
    
    // ✅ Initialize reactions structure safely
    const reactions = post.reactions || {};
    const reaction = reactions[reactionType] || { count: 0, users: [] };
    const users = Array.isArray(reaction.users) ? reaction.users : [];

    const hasReacted = users.includes(user.email);

    // ✅ Toggle reaction
    const updatedUsers = hasReacted 
      ? users.filter(u => u !== user.email)
      : [...users, user.email];

    const updatedReaction = {
      count: Math.max(0, updatedUsers.length),
      users: updatedUsers
    };

    const updatedReactions = {
      ...reactions,
      [reactionType]: updatedReaction
    };

    // ✅ Update post with error handling
    try {
      await base44.asServiceRole.entities.Post.update(postId, {
        reactions: updatedReactions
      });
    } catch (updateError) {
      console.error('❌ Update error:', updateError);
      return Response.json({
        ok: false,
        success: false,
        error: 'Update failed',
        message: 'Fehler beim Aktualisieren'
      }, { status: 500 });
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Reaction updated in ${duration}ms`);

    return Response.json({
      ok: true,
      success: true,
      data: {
        reacted: !hasReacted,
        reactions: updatedReactions,
        reaction_type: reactionType
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Reaction error after ${duration}ms:`, error);

    return Response.json({
      ok: false,
      success: false,
      error: error.message || 'Internal error',
      message: 'Ein Fehler ist aufgetreten',
      stack: error.stack
    }, { status: 500 });
  }
});