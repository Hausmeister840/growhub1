import { secureWrapper } from '../_shared/secureWrapper.js';
import { RATE_LIMITS } from '../_shared/rateLimiter.js';

/**
 * 💬 CREATE COMMENT - PRODUCTION READY
 * Erstellt Kommentar mit Stats-Update
 */

Deno.serve(secureWrapper(async (req, { base44, user, body }) => {
  const startTime = Date.now();

  try {
    const { post_id, content, parent_comment_id = null } = body || {};

    // ✅ Validation
    if (!post_id) {
      return Response.json({
        ok: false,
        error: 'post_id required',
        message: 'Post-ID fehlt'
      }, { status: 400 });
    }

    if (!content || !content.trim()) {
      return Response.json({
        ok: false,
        error: 'content required',
        message: 'Kommentar-Text fehlt'
      }, { status: 400 });
    }

    if (content.length > 1000) {
      return Response.json({
        ok: false,
        error: 'Content too long',
        message: 'Kommentar zu lang (max 1000 Zeichen)'
      }, { status: 400 });
    }

    console.log('💬 Creating comment on post:', post_id, 'by', user.email);

    // ✅ Check if post exists
    const posts = await base44.asServiceRole.entities.Post.filter({ id: post_id });
    
    if (posts.length === 0) {
      return Response.json({
        ok: false,
        error: 'Post not found',
        message: 'Post nicht gefunden'
      }, { status: 404 });
    }

    const post = posts[0];

    // ✅ Check if parent comment exists (if replying)
    if (parent_comment_id) {
      const parentComments = await base44.asServiceRole.entities.Comment.filter({ 
        id: parent_comment_id 
      });
      
      if (parentComments.length === 0) {
        return Response.json({
          ok: false,
          error: 'Parent comment not found',
          message: 'Ursprünglicher Kommentar nicht gefunden'
        }, { status: 404 });
      }
    }

    // ✅ Create comment
    const newComment = await base44.asServiceRole.entities.Comment.create({
      post_id,
      author_email: user.email,
      content: content.trim(),
      parent_comment_id,
      reactions: {
        total: 0,
        byType: {},
        myReactions: {}
      }
    });

    console.log('✅ Comment created:', newComment.id);

    // ✅ Update post stats
    try {
      const currentCommentsCount = post.comments_count || 0;
      
      await base44.asServiceRole.entities.Post.update(post_id, {
        comments_count: currentCommentsCount + 1
      });

      console.log('✅ Post stats updated');
    } catch (error) {
      console.warn('⚠️ Failed to update post stats:', error);
    }

    // ✅ Update user stats
    try {
      const currentUser = await base44.asServiceRole.entities.User.filter({ 
        id: user.id 
      });
      
      if (currentUser.length > 0) {
        const totalComments = (currentUser[0].total_comments || 0) + 1;
        
        await base44.asServiceRole.entities.User.update(user.id, {
          total_comments: totalComments
        });

        console.log('✅ User stats updated');
      }
    } catch (error) {
      console.warn('⚠️ Failed to update user stats:', error);
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Comment created in ${duration}ms`);

    return Response.json({
      ok: true,
      success: true,
      comment: newComment,
      post_id,
      message: 'Kommentar erstellt'
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Create comment error after ${duration}ms:`, error);

    return Response.json({
      ok: false,
      success: false,
      error: 'Comment creation failed',
      message: 'Kommentar konnte nicht erstellt werden',
      details: error.message
    }, { status: 500 });
  }
}, {
  requireAuth: true,
  rateLimit: RATE_LIMITS.createComment,
  maxBodySizeKB: 64
}));