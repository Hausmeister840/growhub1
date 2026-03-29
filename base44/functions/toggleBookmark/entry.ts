import { createClientFromRequest } from 'npm:@base44/sdk@0.7.0';

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

    const { post_id } = await req.json();

    if (!post_id) {
      return Response.json({
        ok: false,
        error: 'post_id_required'
      }, { status: 400 });
    }

    console.log(`🔄 Toggle bookmark: post ${post_id} by ${user.email}`);

    // Check if bookmark already exists
    const existingBookmarks = await base44.entities.Bookmark.filter({
      post_id,
      user_id: user.id
    });

    let isAdding = false;

    if (existingBookmarks.length > 0) {
      // Remove existing bookmark
      await base44.entities.Bookmark.delete(existingBookmarks[0].id);
      
      // Decrement post stats
      await base44.entities.Post.update(post_id, {}, {
        increment: { stats_bookmarks: -1 }
      });

      console.log(`➖ Removed bookmark from post ${post_id}`);
    } else {
      // Add new bookmark
      await base44.entities.Bookmark.create({
        post_id,
        user_id: user.id
      });

      // Increment post stats
      await base44.entities.Post.update(post_id, {}, {
        increment: { stats_bookmarks: 1 }
      });

      isAdding = true;
      console.log(`➕ Added bookmark to post ${post_id}`);
    }

    // Get updated post data
    const updatedPost = await base44.entities.Post.filter({ id: post_id });
    
    return Response.json({
      ok: true,
      post_id,
      is_bookmarked: isAdding,
      new_count: updatedPost[0]?.stats_bookmarks || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Toggle bookmark error:', error);
    
    return Response.json({
      ok: false,
      error: 'toggle_failed',
      message: error.message
    }, { status: 500 });
  }
});