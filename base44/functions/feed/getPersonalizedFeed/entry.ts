import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { limit = 20 } = await req.json().catch(() => ({}));

    // Get user's following list
    const following = user.following || [];
    
    // Get posts from followed users + own posts
    const posts = await base44.asServiceRole.entities.Post.filter(
      { status: 'published' },
      '-created_date',
      limit * 2
    );

    // Score and sort posts
    const scoredPosts = posts.map(post => {
      let score = 0;
      
      // Higher score for posts from followed users
      if (following.includes(post.created_by)) {
        score += 100;
      }
      
      // Engagement score
      const likes = post.reactions?.like?.count || 0;
      const comments = post.comments_count || 0;
      score += likes * 2 + comments * 5;
      
      // Recency bonus (within 24h)
      const hoursSincePost = (Date.now() - new Date(post.created_date).getTime()) / (1000 * 60 * 60);
      if (hoursSincePost < 24) {
        score += 50;
      }
      
      return { ...post, _score: score };
    });

    // Sort by score and limit
    const sorted = scoredPosts
      .sort((a, b) => b._score - a._score)
      .slice(0, limit)
      .map(({ _score, ...post }) => post);

    return Response.json({ 
      success: true, 
      posts: sorted 
    });

  } catch (error) {
    console.error('Personalized feed error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});