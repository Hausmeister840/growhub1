import { secureWrapper } from '../_shared/secureWrapper.js';
import { RATE_LIMITS } from '../_shared/rateLimiter.js';

/**
 * 📊 ADMIN ANALYTICS DASHBOARD
 * Liefert umfassende Statistiken für Admins
 */

Deno.serve(secureWrapper(async (req, { base44 }) => {
  try {
    const url = new URL(req.url);
    const period = url.searchParams.get('period') || '7d'; // 24h, 7d, 30d, all

    console.log(`📊 [Analytics] Loading dashboard for period: ${period}`);

    // ✅ Zeitraum berechnen
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0); // All time
    }

    const startISO = startDate.toISOString();

    // ✅ Parallel Daten laden
    const [
      totalUsers,
      newUsers,
      totalPosts,
      newPosts,
      totalComments,
      newComments,
      activeUsers,
      topPosts,
      topCreators,
      reports
    ] = await Promise.all([
      // Total Users
      base44.asServiceRole.entities.User.list(null, 0).then(users => users.length),
      
      // New Users
      base44.asServiceRole.entities.User.filter({
        created_date: { $gte: startISO }
      }).then(users => users.length),
      
      // Total Posts
      base44.asServiceRole.entities.Post.list(null, 0).then(posts => posts.length),
      
      // New Posts
      base44.asServiceRole.entities.Post.filter({
        created_date: { $gte: startISO }
      }).then(posts => posts.length),
      
      // Total Comments
      base44.asServiceRole.entities.Comment.list(null, 0).then(comments => comments.length),
      
      // New Comments
      base44.asServiceRole.entities.Comment.filter({
        created_date: { $gte: startISO }
      }).then(comments => comments.length),
      
      // Active Users (posted/commented in period)
      base44.asServiceRole.entities.Post.filter({
        created_date: { $gte: startISO }
      }).then(posts => {
        const uniqueUsers = new Set(posts.map(p => p.created_by));
        return uniqueUsers.size;
      }),
      
      // Top Posts by engagement
      base44.asServiceRole.entities.Post.filter({
        created_date: { $gte: startISO }
      }, '-view_count', 10),
      
      // Top Creators by post count
      base44.asServiceRole.entities.Post.filter({
        created_date: { $gte: startISO }
      }).then(posts => {
        const creatorCounts = {};
        posts.forEach(p => {
          creatorCounts[p.created_by] = (creatorCounts[p.created_by] || 0) + 1;
        });
        return Object.entries(creatorCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([email, count]) => ({ email, post_count: count }));
      }),
      
      // Reports
      base44.asServiceRole.entities.Report.filter({
        created_at: { $gte: startISO }
      })
    ]);

    // ✅ Growth Calculations
    const userGrowth = totalUsers > 0 ? ((newUsers / totalUsers) * 100).toFixed(1) : 0;
    const postGrowth = totalPosts > 0 ? ((newPosts / totalPosts) * 100).toFixed(1) : 0;

    // ✅ Engagement Rate
    const engagementRate = totalPosts > 0 
      ? ((totalComments / totalPosts) * 100).toFixed(1) 
      : 0;

    // ✅ User Retention (active/total in period)
    const retentionRate = newUsers > 0 
      ? ((activeUsers / newUsers) * 100).toFixed(1) 
      : 0;

    const analytics = {
      period,
      overview: {
        total_users: totalUsers,
        new_users: newUsers,
        user_growth_pct: parseFloat(userGrowth),
        
        total_posts: totalPosts,
        new_posts: newPosts,
        post_growth_pct: parseFloat(postGrowth),
        
        total_comments: totalComments,
        new_comments: newComments,
        
        active_users: activeUsers,
        engagement_rate_pct: parseFloat(engagementRate),
        retention_rate_pct: parseFloat(retentionRate)
      },
      
      top_content: {
        posts: topPosts.map(p => ({
          id: p.id,
          content: p.content?.substring(0, 100) || '',
          author: p.created_by,
          views: p.view_count || 0,
          reactions: Object.values(p.reactions || {}).reduce((sum, r) => sum + (r.count || 0), 0),
          comments: p.comments_count || 0
        }))
      },
      
      top_creators: topCreators,
      
      moderation: {
        total_reports: reports.length,
        open_reports: reports.filter(r => r.status === 'open').length,
        resolved_reports: reports.filter(r => r.status === 'actioned').length
      }
    };

    return Response.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('❌ Analytics error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}, {
  requireAuth: true,
  requireRoles: ['admin', 'moderator'],
  rateLimit: RATE_LIMITS.read,
  maxBodySizeKB: 64
}));