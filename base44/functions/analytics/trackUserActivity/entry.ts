import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * 📊 USER ACTIVITY TRACKER
 * Trackt alle User-Interaktionen für Feed-Algorithmus und Analytics
 * Optimiert für hohe Performance und Batch-Processing
 */

const BATCH_SIZE = 50;
const activityQueue = [];
let flushTimeout = null;

// ✅ Event Validation
const VALID_EVENTS = new Set([
  'impression', 'watch_start', 'watch_30s', 'watch_100',
  'like', 'comment', 'share', 'save', 'follow_creator',
  'hide', 'not_interested', 'report', 'open_comments',
  'rewatch', 'click_profile'
]);

// ✅ Batch Flush
async function flushActivityBatch(base44) {
  if (activityQueue.length === 0) return;

  const batch = activityQueue.splice(0, BATCH_SIZE);
  
  try {
    await base44.asServiceRole.entities.UserActivity.bulkCreate(batch);
    console.log(`✅ Flushed ${batch.length} activity events`);
  } catch (error) {
    console.error('❌ Error flushing activity batch:', error);
    // Re-queue auf Fehler (mit Limit)
    if (activityQueue.length < 500) {
      activityQueue.unshift(...batch);
    }
  }
}

// ✅ Schedule Flush
function scheduleBatchFlush(base44) {
  if (flushTimeout) clearTimeout(flushTimeout);
  
  flushTimeout = setTimeout(() => {
    flushActivityBatch(base44);
  }, 2000); // 2 Sekunden Batch-Window
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // ✅ Auth (optional für anonymous tracking)
    let currentUser = null;
    try {
      currentUser = await base44.auth.me();
    } catch (authError) {
      // Anonymous tracking erlauben
    }

    const body = await req.json();
    const {
      event_type,
      post_id,
      creator_id,
      tab,
      watch_time_ms,
      completion_pct,
      session_id,
      device_type,
      network_type,
      meta
    } = body;

    // ✅ Validation
    if (!event_type || !VALID_EVENTS.has(event_type)) {
      return Response.json({
        success: false,
        error: 'Invalid event_type'
      }, { status: 400 });
    }

    if (!currentUser && !session_id) {
      return Response.json({
        success: false,
        error: 'User or session_id required'
      }, { status: 400 });
    }

    // ✅ Activity Event erstellen
    const activity = {
      user_email: currentUser?.email || `anon_${session_id}`,
      session_id: session_id || `session_${Date.now()}`,
      event_type,
      post_id: post_id || null,
      creator_id: creator_id || null,
      tab: tab || 'latest',
      watch_time_ms: watch_time_ms || 0,
      completion_pct: completion_pct || 0,
      network_type: network_type || 'unknown',
      device_type: device_type || 'unknown',
      meta: meta || {}
    };

    // ✅ Zu Batch hinzufügen
    activityQueue.push(activity);

    // ✅ Sofort flushen wenn Batch voll
    if (activityQueue.length >= BATCH_SIZE) {
      await flushActivityBatch(base44);
    } else {
      scheduleBatchFlush(base44);
    }

    // ✅ Real-time Updates für wichtige Events
    if (['like', 'comment', 'share', 'follow_creator'].includes(event_type)) {
      try {
        // Update Post-Stats in Real-time
        if (post_id) {
          const post = await base44.asServiceRole.entities.Post.get(post_id);
          if (post) {
            const updates = {};
            
            if (event_type === 'like') {
              updates.view_count = (post.view_count || 0) + 1;
            }
            if (event_type === 'share') {
              updates.share_count = (post.share_count || 0) + 1;
            }
            
            if (Object.keys(updates).length > 0) {
              await base44.asServiceRole.entities.Post.update(post_id, updates);
            }
          }
        }
      } catch (updateError) {
        console.error('Error updating post stats:', updateError);
      }
    }

    return Response.json({
      success: true,
      queued: activityQueue.length,
      processed: event_type
    });

  } catch (error) {
    console.error('❌ Activity tracking error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});