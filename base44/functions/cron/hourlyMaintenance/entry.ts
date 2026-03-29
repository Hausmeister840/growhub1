import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * ⏰ HOURLY MAINTENANCE CRON
 * Läuft stündlich und führt wichtige Wartungsaufgaben aus:
 * - Post-Scores aktualisieren
 * - Cache aufräumen
 * - Notifications bereinigen
 * - Analytics aggregieren
 */

Deno.serve(async (req) => {
  const startTime = Date.now();
  
  try {
    const base44 = createClientFromRequest(req);
    
    console.log('⏰ [HourlyMaintenance] Starting...');
    
    const tasks = [];
    const results = {};
    
    // ✅ Task 1: Post-Scores aktualisieren
    tasks.push(
      base44.asServiceRole.functions.invoke('maintenance/updatePostScores')
        .then(res => {
          results.postScores = res.data;
          console.log('✅ Post scores updated');
        })
        .catch(err => {
          results.postScores = { error: err.message };
          console.error('❌ Post scores error:', err);
        })
    );
    
    // ✅ Task 2: Alte Notifications löschen (älter als 30 Tage)
    tasks.push(
      (async () => {
        try {
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
          const oldNotifs = await base44.asServiceRole.entities.Notification.filter({
            created_date: { $lt: thirtyDaysAgo },
            read: true
          }, null, 1000);
          
          let deleted = 0;
          for (const notif of oldNotifs) {
            await base44.asServiceRole.entities.Notification.delete(notif.id);
            deleted++;
          }
          
          results.notifications = { deleted };
          console.log(`✅ Deleted ${deleted} old notifications`);
        } catch (err) {
          results.notifications = { error: err.message };
          console.error('❌ Notifications cleanup error:', err);
        }
      })()
    );
    
    // ✅ Task 3: User-Stats aktualisieren
    tasks.push(
      (async () => {
        try {
          // Top 100 aktivste User
          const users = await base44.asServiceRole.entities.User.list('-posts_count', 100);
          
          let updated = 0;
          for (const user of users) {
            // Zähle Posts
            const posts = await base44.asServiceRole.entities.Post.filter({
              created_by: user.email
            });
            
            const postsCount = posts.length;
            
            // Zähle Reaktionen
            const totalReactions = posts.reduce((sum, post) => {
              const reactions = post.reactions || {};
              return sum + Object.values(reactions).reduce((s, r) => s + (r?.count || 0), 0);
            }, 0);
            
            // Update User
            if (user.posts_count !== postsCount || user.total_reactions_received !== totalReactions) {
              await base44.asServiceRole.entities.User.update(user.id, {
                posts_count: postsCount,
                total_reactions_received: totalReactions
              });
              updated++;
            }
          }
          
          results.userStats = { updated };
          console.log(`✅ Updated stats for ${updated} users`);
        } catch (err) {
          results.userStats = { error: err.message };
          console.error('❌ User stats error:', err);
        }
      })()
    );
    
    // Alle Tasks parallel ausführen
    await Promise.all(tasks);
    
    const duration = Date.now() - startTime;
    console.log(`✅ [HourlyMaintenance] Complete in ${duration}ms`);
    
    return Response.json({
      success: true,
      duration,
      results
    });
    
  } catch (error) {
    console.error('❌ [HourlyMaintenance] Fatal error:', error);
    return Response.json({
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    }, { status: 500 });
  }
});