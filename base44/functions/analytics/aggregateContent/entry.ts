import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * 📊 AGGREGATE CONTENT METRICS
 * Processes UserActivity → ContentAggregate
 * Run every 5 minutes via cron
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin required' }, { status: 403 });
    }

    console.log('📊 Starting content aggregation...');

    // Get recent activities (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const activities = await base44.asServiceRole.entities.UserActivity.filter({
      created_date: { $gte: twentyFourHoursAgo }
    }, '-created_date', 10000);

    console.log(`📊 Processing ${activities.length} activities`);

    // Group by post_id
    const postMetrics = new Map();

    activities.forEach(activity => {
      if (!activity.post_id) return;

      if (!postMetrics.has(activity.post_id)) {
        postMetrics.set(activity.post_id, {
          views_1h: 0,
          views_24h: 0,
          likes_1h: 0,
          likes_24h: 0,
          comments_1h: 0,
          comments_24h: 0,
          shares_1h: 0,
          shares_24h: 0,
          completion_1h: 0,
          completion_24h: 0,
          hides_1h: 0,
          hides_24h: 0,
          reports_1h: 0,
          reports_24h: 0
        });
      }

      const metrics = postMetrics.get(activity.post_id);
      const isRecent = new Date(activity.created_date) > new Date(oneHourAgo);

      // Count by event type
      switch (activity.event_type) {
        case 'impression':
          metrics.views_24h++;
          if (isRecent) metrics.views_1h++;
          break;
        case 'like':
          metrics.likes_24h++;
          if (isRecent) metrics.likes_1h++;
          break;
        case 'comment':
          metrics.comments_24h++;
          if (isRecent) metrics.comments_1h++;
          break;
        case 'share':
          metrics.shares_24h++;
          if (isRecent) metrics.shares_1h++;
          break;
        case 'watch_100':
          metrics.completion_24h++;
          if (isRecent) metrics.completion_1h++;
          break;
        case 'hide':
          metrics.hides_24h++;
          if (isRecent) metrics.hides_1h++;
          break;
        case 'report':
          metrics.reports_24h++;
          if (isRecent) metrics.reports_1h++;
          break;
      }
    });

    // Update ContentAggregate
    let updated = 0;
    for (const [postId, metrics] of postMetrics.entries()) {
      try {
        // Calculate growth rate
        const growth_1h = metrics.views_1h + metrics.likes_1h + metrics.comments_1h;
        const growth_24h = metrics.views_24h + metrics.likes_24h + metrics.comments_24h;

        // Calculate quality score
        const engagement_rate = metrics.views_24h > 0 
          ? (metrics.likes_24h + metrics.comments_24h * 2 + metrics.shares_24h * 3) / metrics.views_24h 
          : 0;

        const completion_rate = metrics.views_24h > 0 
          ? metrics.completion_24h / metrics.views_24h 
          : 0;

        const negative_signals = (metrics.hides_24h * 2 + metrics.reports_24h * 5) / Math.max(metrics.views_24h, 1);

        const quality_score = Math.max(0, Math.min(1, 
          engagement_rate * 0.5 + 
          completion_rate * 0.3 - 
          negative_signals * 0.2
        ));

        // Check if exists
        const existing = await base44.asServiceRole.entities.ContentAggregate.filter({ post_id: postId });

        if (existing.length > 0) {
          await base44.asServiceRole.entities.ContentAggregate.update(existing[0].id, {
            ...metrics,
            growth_1h,
            growth_24h,
            quality_score,
            last_update: new Date().toISOString()
          });
        } else {
          await base44.asServiceRole.entities.ContentAggregate.create({
            post_id: postId,
            ...metrics,
            growth_1h,
            growth_24h,
            quality_score,
            last_update: new Date().toISOString()
          });
        }

        updated++;
      } catch (error) {
        console.error(`Failed to update aggregate for post ${postId}:`, error);
      }
    }

    console.log(`✅ Updated ${updated} content aggregates`);

    return Response.json({
      success: true,
      processed: activities.length,
      updated
    });

  } catch (error) {
    console.error('Aggregation error:', error);
    return Response.json({ 
      error: 'Aggregation failed',
      details: error.message 
    }, { status: 500 });
  }
});