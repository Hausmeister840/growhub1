import { secureWrapper } from '../../_shared/secureWrapper.js';
import { RATE_LIMITS } from '../../_shared/rateLimiter.js';

Deno.serve(secureWrapper(async (req, { base44, user, body }) => {
  try {
    const { postId, content, parentCommentId } = body || {};

    if (!postId || !content?.trim()) {
      return Response.json({ error: 'post_id required', message: 'Post-ID fehlt' }, { status: 400 });
    }

    // Verify post exists
    const post = await base44.asServiceRole.entities.Post.get(postId).catch(() => null);

    if (!post) {
      return Response.json({ error: 'Post not found', message: 'Post existiert nicht' }, { status: 404 });
    }

    // Create comment with service role after authenticating the user
    const comment = await base44.asServiceRole.entities.Comment.create({
      post_id: postId,
      content: content.trim(),
      author_email: user.email,
      parent_comment_id: parentCommentId || null,
      reactions: { total: 0, byType: {} }
    });

    // Update comment count on post
    const newCount = (post.comments_count || 0) + 1;
    await base44.asServiceRole.entities.Post.update(postId, { comments_count: newCount }).catch(() => {});

    // Create notification for post author (not for own comments)
    const authorEmail = post.created_by;
    if (authorEmail && authorEmail !== user.email) {
      try {
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: authorEmail,
          sender_email: user.email,
          sender_id: user.id,
          type: 'comment',
          post_id: postId,
          message: `${user.full_name || user.username || 'Jemand'} hat deinen Post kommentiert 💬`,
          read: false
        });
      } catch (notifErr) {
        console.warn('Comment notification failed (non-critical):', notifErr.message);
      }
    }

    // If it's a reply, notify the parent comment author too
    if (parentCommentId) {
      try {
        const parentComment = await base44.asServiceRole.entities.Comment.get(parentCommentId).catch(() => null);
        if (parentComment && parentComment.author_email && parentComment.author_email !== user.email && parentComment.author_email !== authorEmail) {
          await base44.asServiceRole.entities.Notification.create({
            recipient_email: parentComment.author_email,
            sender_email: user.email,
            sender_id: user.id,
            type: 'comment',
            post_id: postId,
            message: `${user.full_name || user.username || 'Jemand'} hat auf deinen Kommentar geantwortet 💬`,
            read: false
          });
        }
      } catch (replyNotifErr) {
        console.warn('Reply notification failed (non-critical):', replyNotifErr.message);
      }
    }

    return Response.json({
      success: true,
      comment
    });

  } catch (error) {
    console.error('Create comment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}, {
  requireAuth: true,
  rateLimit: RATE_LIMITS.createComment,
  maxBodySizeKB: 64
}));