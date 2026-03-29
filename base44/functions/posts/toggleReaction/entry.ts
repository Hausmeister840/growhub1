import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const { postId, reactionType } = await req.clone().json();
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!postId || !reactionType) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const validReactions = ['like', 'fire', 'laugh', 'mind_blown', 'helpful', 'celebrate'];
    if (!validReactions.includes(reactionType)) {
      return Response.json({ error: 'Invalid reaction type' }, { status: 400 });
    }

    const post = await base44.asServiceRole.entities.Post.get(postId).catch(() => null);

    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    // Initialize reactions structure
    const reactions = post.reactions || {};
    if (!reactions[reactionType]) {
      reactions[reactionType] = { count: 0, users: [] };
    }

    const hasReacted = reactions[reactionType].users?.includes(user.email);
    
    if (hasReacted) {
      // Remove reaction
      reactions[reactionType].users = reactions[reactionType].users.filter(e => e !== user.email);
      reactions[reactionType].count = Math.max(0, (reactions[reactionType].count || 0) - 1);
    } else {
      // Add reaction
      reactions[reactionType].users = [...(reactions[reactionType].users || []), user.email];
      reactions[reactionType].count = (reactions[reactionType].count || 0) + 1;

      // Create notification for post author (not for own posts)
      const authorEmail = post.created_by;
      if (authorEmail && authorEmail !== user.email) {
        const reactionEmojis = { like: '❤️', fire: '🔥', laugh: '😂', mind_blown: '🤯', helpful: '💡', celebrate: '🎉' };
        const emoji = reactionEmojis[reactionType] || '❤️';
        try {
          await base44.asServiceRole.entities.Notification.create({
            recipient_email: authorEmail,
            sender_email: user.email,
            sender_id: user.id,
            type: 'reaction',
            post_id: postId,
            message: `${user.full_name || user.username || 'Jemand'} hat auf deinen Post reagiert ${emoji}`,
            read: false
          });
        } catch (notifErr) {
          console.warn('Notification failed (non-critical):', notifErr.message);
        }
      }
    }

    // Update post
    await base44.asServiceRole.entities.Post.update(postId, { reactions });

    return Response.json({
      success: true,
      hasReacted: !hasReacted,
      reactions
    });

  } catch (error) {
    console.error('Toggle reaction error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});