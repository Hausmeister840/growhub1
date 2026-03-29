import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { limit = 20, timeWindow = 24 } = await req.json().catch(() => ({}));

    // Get recent posts
    const cutoffDate = new Date(Date.now() - timeWindow * 60 * 60 * 1000).toISOString();
    
    const posts = await base44.asServiceRole.entities.Post.filter(
      { status: 'published' },
      '-created_date',
      limit * 3
    );

    // Filter by time window and calculate viral score
    const trendingPosts = posts
      .filter(post => post.created_date >= cutoffDate)
      .map(post => {
        const likes = post.reactions?.like?.count || 0;
        const comments = post.comments_count || 0;
        const views = post.view_count || 0;
        
        // Viral score: weighted by engagement
        const viralScore = likes * 3 + comments * 10 + views * 0.1;
        
        // Decay based on age
        const hoursOld = (Date.now() - new Date(post.created_date).getTime()) / (1000 * 60 * 60);
        const decayFactor = Math.max(0, 1 - (hoursOld / timeWindow));
        
        const finalScore = viralScore * decayFactor;
        
        return { ...post, viral_score: finalScore };
      });

    // Sort by viral score
    const sorted = trendingPosts
      .sort((a, b) => b.viral_score - a.viral_score)
      .slice(0, limit)
      .map(({ viral_score, ...post }) => post);

    return Response.json({ 
      success: true, 
      posts: sorted 
    });

  } catch (error) {
    console.error('Trending feed error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});