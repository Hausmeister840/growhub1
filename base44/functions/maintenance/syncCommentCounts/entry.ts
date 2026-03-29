import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all comments
    const allComments = await base44.asServiceRole.entities.Comment.filter({}, '-created_date', 1000);
    
    // Count comments per post
    const countMap = {};
    for (const comment of (allComments || [])) {
      const postId = comment.post_id;
      if (!postId) continue;
      countMap[postId] = (countMap[postId] || 0) + 1;
    }

    // Update each post's comments_count
    let updated = 0;
    for (const [postId, count] of Object.entries(countMap)) {
      try {
        await base44.asServiceRole.entities.Post.update(postId, { comments_count: count });
        updated++;
      } catch (err) {
        console.warn(`Failed to update post ${postId}:`, err.message);
      }
    }

    return Response.json({ 
      success: true, 
      postsUpdated: updated, 
      commentCounts: countMap 
    });
  } catch (error) {
    console.error('syncCommentCounts error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});