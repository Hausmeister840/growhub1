import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * 🔄 POST SCORES UPDATER
 * Cronjob der regelmäßig Post-Engagement-Scores aktualisiert
 * Sollte stündlich/täglich laufen
 */

// ✅ Berechne Engagement-Score
function calculateEngagementScore(post) {
  const now = Date.now();
  const createdAt = new Date(post.created_date).getTime();
  const ageHours = Math.max(1, (now - createdAt) / (1000 * 60 * 60));
  
  // Reaktionen zählen
  const reactions = post.reactions || {};
  const totalReactions = Object.values(reactions).reduce((sum, r) => {
    return sum + (r?.count || 0);
  }, 0);
  
  const comments = post.comments_count || 0;
  const shares = post.share_count || 0;
  const views = post.view_count || 0;
  const bookmarks = post.bookmarked_by_users?.length || 0;
  
  // Gewichtete Summe
  const engagementScore = (
    totalReactions * 3 +
    comments * 5 +
    shares * 10 +
    views * 0.1 +
    bookmarks * 2
  );
  
  // Zeit-Decay (neuere Posts werden bevorzugt)
  const recencyFactor = Math.max(0.1, 1 / Math.pow(ageHours / 24, 0.5));
  
  return Math.round(engagementScore * recencyFactor);
}

// ✅ Berechne Viral-Score (für Trending-Tab)
function calculateViralScore(post, windowHours = 24) {
  const now = Date.now();
  const createdAt = new Date(post.created_date).getTime();
  const ageHours = (now - createdAt) / (1000 * 60 * 60);
  
  // Nur Posts innerhalb des Zeitfensters
  if (ageHours > windowHours) {
    return 0;
  }
  
  const reactions = post.reactions || {};
  const totalReactions = Object.values(reactions).reduce((sum, r) => {
    return sum + (r?.count || 0);
  }, 0);
  
  const comments = post.comments_count || 0;
  const growthRate = totalReactions + comments * 2;
  
  // Starke Bevorzugung sehr neuer Posts
  const recencyBoost = Math.max(1, (windowHours - ageHours) / windowHours * 3);
  
  return Math.round(growthRate * recencyBoost);
}

Deno.serve(async (req) => {
  const startTime = Date.now();
  
  try {
    const base44 = createClientFromRequest(req);
    
    // ✅ Service-Role für Batch-Updates
    console.log('🔄 [UpdatePostScores] Starting batch update...');
    
    // Lade alle Posts der letzten 7 Tage
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const posts = await base44.asServiceRole.entities.Post.filter({
      created_date: { $gte: sevenDaysAgo }
    }, '-created_date', 1000);
    
    console.log(`📊 [UpdatePostScores] Processing ${posts.length} posts...`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    // Batch-Update (in Gruppen von 50)
    const batchSize = 50;
    for (let i = 0; i < posts.length; i += batchSize) {
      const batch = posts.slice(i, i + batchSize);
      
      await Promise.allSettled(batch.map(async (post) => {
        try {
          const engagementScore = calculateEngagementScore(post);
          const viralScore = calculateViralScore(post, 24);
          
          // Nur updaten wenn sich Scores signifikant geändert haben
          const hasChanged = (
            !post.engagement_score || 
            Math.abs(post.engagement_score - engagementScore) > 10 ||
            !post.viral_score ||
            Math.abs(post.viral_score - viralScore) > 5
          );
          
          if (hasChanged) {
            await base44.asServiceRole.entities.Post.update(post.id, {
              engagement_score: engagementScore,
              viral_score: viralScore,
              scores_updated_at: new Date().toISOString()
            });
            updatedCount++;
          }
        } catch (error) {
          console.error(`Error updating post ${post.id}:`, error);
          errorCount++;
        }
      }));
      
      // Kurze Pause zwischen Batches
      if (i + batchSize < posts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ [UpdatePostScores] Complete: ${updatedCount} updated, ${errorCount} errors, ${duration}ms`);
    
    return Response.json({
      success: true,
      totalProcessed: posts.length,
      updated: updatedCount,
      errors: errorCount,
      duration
    });
    
  } catch (error) {
    console.error('❌ [UpdatePostScores] Fatal error:', error);
    return Response.json({
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    }, { status: 500 });
  }
});