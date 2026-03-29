import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * 📊 GET ANALYTICS DASHBOARD
 * Returns aggregated metrics for dashboard
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin required' }, { status: 403 });
    }

    const { period = '24h' } = await req.json().catch(() => ({}));

    // Get time range
    const now = Date.now();
    const ranges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const rangeMs = ranges[period] || ranges['24h'];
    const startDate = new Date(now - rangeMs).toISOString();

    // Get activities
    const activities = await base44.asServiceRole.entities.UserActivity.filter({
      created_date: { $gte: startDate }
    }, '-created_date', 50000);

    // Aggregate metrics
    const metrics = {
      total_users: new Set(),
      total_views: 0,
      total_likes: 0,
      total_comments: 0,
      total_shares: 0,
      total_follows: 0,
      avg_watch_time: 0,
      top_posts: new Map(),
      top_creators: new Map(),
      by_tab: {
        for_you: 0,
        latest: 0,
        trending: 0,
        videos: 0,
        following: 0
      },
      by_device: {
        mobile: 0,
        tablet: 0,
        desktop: 0
      },
      timeline: []
    };

    activities.forEach(activity => {
      metrics.total_users.add(activity.user_email);

      switch (activity.event_type) {
        case 'impression':
          metrics.total_views++;
          if (activity.tab) {
            metrics.by_tab[activity.tab] = (metrics.by_tab[activity.tab] || 0) + 1;
          }
          break;
        case 'like':
          metrics.total_likes++;
          break;
        case 'comment':
          metrics.total_comments++;
          break;
        case 'share':
          metrics.total_shares++;
          break;
        case 'follow_creator':
          metrics.total_follows++;
          break;
      }

      // Track post performance
      if (activity.post_id) {
        const count = metrics.top_posts.get(activity.post_id) || 0;
        metrics.top_posts.set(activity.post_id, count + 1);
      }

      // Track creator performance
      if (activity.creator_id) {
        const count = metrics.top_creators.get(activity.creator_id) || 0;
        metrics.top_creators.set(activity.creator_id, count + 1);
      }

      // Device tracking
      if (activity.meta?.device_type) {
        metrics.by_device[activity.meta.device_type]++;
      }
    });

    // Convert top posts/creators to arrays
    metrics.top_posts = Array.from(metrics.top_posts.entries())
      .map(([post_id, count]) => ({ post_id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    metrics.top_creators = Array.from(metrics.top_creators.entries())
      .map(([creator_id, count]) => ({ creator_id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    metrics.total_users = metrics.total_users.size;

    // Calculate engagement rate
    metrics.engagement_rate = metrics.total_views > 0 
      ? ((metrics.total_likes + metrics.total_comments + metrics.total_shares) / metrics.total_views * 100).toFixed(2)
      : 0;

    return Response.json({
      success: true,
      period,
      metrics
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return Response.json({ 
      error: 'Failed to get dashboard',
      details: error.message 
    }, { status: 500 });
  }
});