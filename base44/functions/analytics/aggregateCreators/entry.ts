import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * 👤 CREATOR AGGREGATION
 * Berechnet Creator-Metriken für Rankings und Empfehlungen
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Hole alle Creator (User mit Posts)
    const allPosts = await base44.entities.Post.filter({
      created_date: { '$gte': sevenDaysAgo.toISOString() }
    });

    // Gruppiere nach Creator
    const creatorStats = {};
    
    for (const post of allPosts) {
      const creator = post.created_by;
      if (!creatorStats[creator]) {
        creatorStats[creator] = {
          total_posts: 0,
          total_views: 0,
          total_likes: 0,
          total_comments: 0,
          total_shares: 0
        };
      }

      const stats = creatorStats[creator];
      stats.total_posts++;
      stats.total_views += post.view_count || 0;
      stats.total_likes += Object.values(post.reactions || {})
        .reduce((sum, r) => sum + (r.count || 0), 0);
      stats.total_comments += post.comments_count || 0;
      stats.total_shares += post.share_count || 0;
    }

    let updated = 0;
    let created = 0;

    // Speichere Aggregates
    for (const [creator_email, stats] of Object.entries(creatorStats)) {
      try {
        // Quality Score berechnen
        const avg_engagement = stats.total_posts > 0 
          ? (stats.total_likes + stats.total_comments) / stats.total_posts 
          : 0;
        
        const quality_score = Math.min(1, avg_engagement / 100);
        
        const existing = await base44.entities.CreatorAggregate.filter({
          creator_email
        });

        const aggregateData = {
          creator_email,
          total_views_7d: stats.total_views,
          quality_score,
          reliability: 1.0,
          last_update: new Date().toISOString()
        };

        if (existing.length > 0) {
          await base44.entities.CreatorAggregate.update(existing[0].id, aggregateData);
          updated++;
        } else {
          await base44.entities.CreatorAggregate.create(aggregateData);
          created++;
        }

      } catch (error) {
        console.error(`Failed to aggregate creator ${creator_email}:`, error);
      }
    }

    return Response.json({
      success: true,
      stats: {
        creators_processed: Object.keys(creatorStats).length,
        updated,
        created
      }
    });

  } catch (error) {
    console.error('Creator aggregation error:', error);
    return Response.json({
      error: error.message
    }, { status: 500 });
  }
});