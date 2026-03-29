import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// ✅ NAMED EXPORT für Platform V2
export async function getDiaryTimeline(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return {
        ok: false,
        error: 'authentication_required'
      };
    }

    // Body parsen
    let diary_id;
    try {
      const body = await req.json();
      diary_id = body.diary_id;
    } catch (e) {
      return {
        ok: false,
        error: 'invalid_request'
      };
    }

    if (!diary_id) {
      return {
        ok: false,
        error: 'diary_id_required'
      };
    }

    // Load diary
    const diaries = await base44.entities.GrowDiary.filter({ id: diary_id });
    if (diaries.length === 0) {
      return {
        ok: false,
        error: 'diary_not_found'
      };
    }

    const diary = diaries[0];

    // Check if user has access
    if (diary.created_by !== user.email && !diary.share_settings?.is_public) {
      return {
        ok: false,
        error: 'access_denied'
      };
    }

    // Load all entries
    const entries = await base44.entities.GrowDiaryEntry.filter(
      { diary_id },
      'day_number',
      500
    );

    // Group by stage for timeline visualization
    const timelineGroups = groupEntriesByStage(entries);

    // Calculate stats
    const stats = calculateDiaryStats(diary, entries);

    // Get milestones
    const milestones = entries.filter(e => e.milestone).map(e => ({
      day: e.day_number,
      type: e.milestone_type,
      description: e.plant_observation
    }));

    return {
      ok: true,
      diary,
      entries,
      timeline_groups: timelineGroups,
      stats,
      milestones,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('🚨 Timeline error:', error);
    
    return {
      ok: false,
      error: 'timeline_failed',
      message: error.message
    };
  }
}

function groupEntriesByStage(entries) {
  const groups = {};
  
  entries.forEach(entry => {
    const stage = entry.growth_stage || 'Unbekannt';
    if (!groups[stage]) {
      groups[stage] = [];
    }
    groups[stage].push(entry);
  });

  return groups;
}

function calculateDiaryStats(diary, entries) {
  const stats = {
    total_days: 0,
    total_entries: entries.length,
    total_photos: 0,
    avg_temp: null,
    avg_humidity: null,
    total_water_ml: 0,
    issues_count: 0,
    health_trend: []
  };

  if (entries.length === 0) return stats;

  // Calculate total days
  const latestEntry = entries[entries.length - 1];
  if (latestEntry) {
    stats.total_days = latestEntry.day_number || 0;
  }

  // Count photos
  entries.forEach(entry => {
    if (entry.media_urls && Array.isArray(entry.media_urls)) {
      stats.total_photos += entry.media_urls.length;
    }
  });

  // Calculate averages
  const temps = entries
    .map(e => e.environment_data?.temp_c)
    .filter(t => t != null);
  if (temps.length > 0) {
    stats.avg_temp = parseFloat((temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1));
  }

  const humidity = entries
    .map(e => e.environment_data?.humidity_rh)
    .filter(h => h != null);
  if (humidity.length > 0) {
    stats.avg_humidity = parseFloat((humidity.reduce((a, b) => a + b, 0) / humidity.length).toFixed(1));
  }

  // Total water
  const water = entries
    .map(e => e.feeding_data?.water_ml || 0)
    .reduce((a, b) => a + b, 0);
  stats.total_water_ml = water;

  // Count issues
  entries.forEach(entry => {
    if (entry.ai_analysis?.detected_issues) {
      stats.issues_count += entry.ai_analysis.detected_issues.length;
    }
  });

  // Health trend (last 10 entries)
  const recentEntries = entries.slice(-10);
  stats.health_trend = recentEntries
    .filter(e => e.ai_analysis?.health_assessment)
    .map(e => ({
      day: e.day_number,
      health: e.ai_analysis.health_assessment
    }));

  return stats;
}

// ✅ DENO SERVE Wrapper
Deno.serve(async (req) => {
  const result = await getDiaryTimeline(req);
  return Response.json(result);
});