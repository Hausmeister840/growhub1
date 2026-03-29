import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

    const { post_id, reaction_type = 'like' } = await req.json();

    if (!post_id) {
      return Response.json({
        ok: false,
        error: 'post_id_required'
      }, { status: 400 });
    }

    console.log(`🔄 Toggle reaction: ${reaction_type} on post ${post_id} by ${user.email}`);

    // Fetch post to get current reactions
    const post = await base44.entities.Post.filter({ id: post_id });
    if (!post || post.length === 0) {
      return Response.json({ ok: false, error: 'post_not_found' }, { status: 404 });
    }

    const reactions = post[0].reactions || {};
    const reactionData = reactions[reaction_type] || { count: 0, users: [] };
    const userHasReacted = reactionData.users?.includes(user.email);

    let isAdding = false;
    let newCount = reactionData.count || 0;
    let newUsers = reactionData.users || [];

    if (userHasReacted) {
      // Remove reaction
      newUsers = newUsers.filter(e => e !== user.email);
      newCount = Math.max(0, newCount - 1);
      console.log(`➖ Removed ${reaction_type} from post ${post_id}`);
    } else {
      // Add reaction
      newUsers = [...newUsers, user.email];
      newCount = newCount + 1;
      isAdding = true;
      console.log(`➕ Added ${reaction_type} to post ${post_id}`);
    }

    // Update post with new reaction data
    const updatedReactions = {
      ...reactions,
      [reaction_type]: { count: newCount, users: newUsers }
    };

    await base44.entities.Post.update(post_id, { reactions: updatedReactions });
    
    return Response.json({
      ok: true,
      post_id,
      reaction_type,
      is_adding: isAdding,
      new_count: newCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Toggle reaction error:', error);
    
    return Response.json({
      ok: false,
      error: 'toggle_failed',
      message: error.message
    }, { status: 500 });
  }
});