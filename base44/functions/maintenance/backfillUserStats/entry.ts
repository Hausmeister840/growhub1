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

    console.log('🔄 Starting user stats backfill...');

    let updatedCount = 0;
    let cursor = null;
    const batchSize = 50;

    while (true) {
      // Get batch of users
      const users = cursor 
        ? await base44.entities.User.list('-created_at', batchSize, cursor)
        : await base44.entities.User.list('-created_at', batchSize);

      if (!users.length) break;

      for (const userRecord of users) {
        try {
          // Count posts
          const posts = await base44.entities.Post.filter({ author_id: userRecord.id });
          const postsCount = posts.length;

          // Count likes given
          const reactions = await base44.entities.Reaction.filter({ user_id: userRecord.id });
          const likesGiven = reactions.length;

          // Count followers
          const followers = await base44.entities.Follow.filter({ following_id: userRecord.id });
          const followersCount = followers.length;

          // Count following
          const following = await base44.entities.Follow.filter({ follower_id: userRecord.id });
          const followingCount = following.length;

          // Count comments
          const comments = await base44.entities.Comment.filter({ author_email: userRecord.email });
          const commentsCount = comments.length;

          // Update user stats
          await base44.entities.User.update(userRecord.id, {
            stats_posts: postsCount,
            stats_likes_given: likesGiven,
            stats_followers: followersCount,
            stats_following: followingCount,
            total_posts: postsCount,
            total_comments: commentsCount
          });

          updatedCount++;
          
          if (updatedCount % 5 === 0) {
            console.log(`👥 Updated ${updatedCount} users...`);
          }

        } catch (error) {
          console.error(`❌ Error updating user ${userRecord.id}:`, error);
        }
      }

      // Set cursor for next batch
      cursor = users[users.length - 1].created_at;
      
      // Safety delay
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`✅ User stats backfill completed: ${updatedCount} users updated`);

    return Response.json({
      ok: true,
      updated_users: updatedCount,
      completed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Backfill user stats error:', error);
    
    return Response.json({
      ok: false,
      error: 'backfill_failed',
      message: error.message
    }, { status: 500 });
  }
});