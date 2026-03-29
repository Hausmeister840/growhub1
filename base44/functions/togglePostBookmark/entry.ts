import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * 🔖 TOGGLE POST BOOKMARK - PRODUCTION READY
 */

Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !user.id) {
      return Response.json({
        ok: false,
        success: false,
        error: 'Authentication required',
        message: 'Bitte melde dich an'
      }, { status: 401 });
    }

    const { postId } = await req.json();

    if (!postId) {
      return Response.json({
        ok: false,
        success: false,
        error: 'Post ID required',
        message: 'Post-ID fehlt'
      }, { status: 400 });
    }

    console.log('🔖 Toggle bookmark:', { postId, user: user.email });

    // Load post
    const posts = await base44.asServiceRole.entities.Post.filter({ id: postId });
    
    if (posts.length === 0) {
      return Response.json({
        ok: false,
        success: false,
        error: 'Post not found',
        message: 'Post nicht gefunden'
      }, { status: 404 });
    }

    const post = posts[0];
    const bookmarkedUsers = post.bookmarked_by_users || [];
    const isBookmarked = bookmarkedUsers.includes(user.email);

    // Toggle
    const updatedBookmarkedUsers = isBookmarked
      ? bookmarkedUsers.filter(email => email !== user.email)
      : [...bookmarkedUsers, user.email];

    // Update post
    await base44.asServiceRole.entities.Post.update(postId, {
      bookmarked_by_users: updatedBookmarkedUsers
    });

    const duration = Date.now() - startTime;
    console.log(`✅ Bookmark toggled in ${duration}ms`);

    return Response.json({
      ok: true,
      success: true,
      data: {
        bookmarked: !isBookmarked,
        bookmarked_by_users: updatedBookmarkedUsers,
        count: updatedBookmarkedUsers.length
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Bookmark error after ${duration}ms:`, error);

    return Response.json({
      ok: false,
      success: false,
      error: error.message || 'Internal error',
      message: 'Ein Fehler ist aufgetreten'
    }, { status: 500 });
  }
});