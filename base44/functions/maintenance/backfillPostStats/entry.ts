import { createClientFromRequest } from 'npm:@base44/sdk@0.7.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Admin check
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({
        ok: false,
        error: 'admin_required'
      }, { status: 403 });
    }

    console.log('🔄 Starting post stats backfill...');

    let updatedCount = 0;
    let cursor = null;
    const batchSize = 100;

    while (true) {
      // Get batch of posts
      const posts = cursor 
        ? await base44.entities.Post.list('-created_at', batchSize, cursor)
        : await base44.entities.Post.list('-created_at', batchSize);

      if (!posts.length) break;

      for (const post of posts) {
        try {
          // Count reactions (likes)
          const reactions = await base44.entities.Reaction.filter({ post_id: post.id });
          const likesCount = reactions.filter(r => r.type === 'like').length;

          // Count comments
          const comments = await base44.entities.Comment.filter({ post_id: post.id });
          const commentsCount = comments.length;

          // Count bookmarks
          const bookmarks = await base44.entities.Bookmark.filter({ post_id: post.id });
          const bookmarksCount = bookmarks.length;

          // Update post stats
          await base44.entities.Post.update(post.id, {
            stats_likes: likesCount,
            stats_comments: commentsCount,
            stats_bookmarks: bookmarksCount
          });

          updatedCount++;
          
          if (updatedCount % 10 === 0) {
            console.log(`📊 Updated ${updatedCount} posts...`);
          }

        } catch (error) {
          console.error(`❌ Error updating post ${post.id}:`, error);
        }
      }

      // Set cursor for next batch
      cursor = posts[posts.length - 1].created_at;
      
      // Safety delay
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Post stats backfill completed: ${updatedCount} posts updated`);

    return Response.json({
      ok: true,
      updated_posts: updatedCount,
      completed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Backfill post stats error:', error);
    
    return Response.json({
      ok: false,
      error: 'backfill_failed',
      message: error.message
    }, { status: 500 });
  }
});