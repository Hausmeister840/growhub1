import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * 🎯 GET USER CONTEXT FOR AI
 * Sammelt umfassenden User-Kontext für personalisierte KI-Antworten
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get current user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`🎯 Building context for user: ${user.email}`);

    // Build comprehensive context
    const context = {
      // Basic Profile
      profile: {
        name: user.full_name,
        username: user.username,
        email: user.email,
        grow_level: user.grow_level || 'beginner',
        interests: user.interests || [],
        location: user.location,
        xp: user.xp || 0,
        badges: user.badges || [],
        created_date: user.created_date
      },

      // Grow History
      grow_history: {
        active_diaries: [],
        recent_entries: [],
        total_grows: 0,
        favorite_strains: [],
        common_issues: [],
        current_stage_info: null
      },

      // Activity Stats
      activity: {
        total_posts: user.total_posts || 0,
        total_comments: user.total_comments || 0,
        reputation_score: user.reputation_score || 0,
        last_active: user.last_online_at
      },

      // Preferences
      preferences: {
        communication_style: 'friendly',
        detail_level: user.grow_level === 'beginner' ? 'detailed' : 'moderate',
        proactive_tips: true
      },

      // Time Context
      time_context: {
        current_time: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        time_of_day: getTimeOfDay()
      }
    };

    // Load Active Grow Diaries
    try {
      const diaries = await base44.asServiceRole.entities.GrowDiary.filter({
        created_by: user.email,
        status: 'active'
      }, '-updated_date', 5);
      
      context.grow_history.active_diaries = diaries.map(d => ({
        id: d.id,
        name: d.name,
        strain: d.strain_name,
        stage: d.current_stage,
        days: d.stats?.total_days || 0,
        health_score: d.ai_insights?.health_score || null,
        issues_count: d.stats?.issues_count || 0,
        start_date: d.start_date
      }));
      
      context.grow_history.total_grows = diaries.length;

      // Get most recent active diary for current stage info
      if (diaries.length > 0) {
        const recentDiary = diaries[0];
        context.grow_history.current_stage_info = {
          diary_name: recentDiary.name,
          stage: recentDiary.current_stage,
          day: recentDiary.stats?.total_days || 0,
          health_score: recentDiary.ai_insights?.health_score || null,
          last_update: recentDiary.updated_date
        };
      }
    } catch (error) {
      console.error('Error loading diaries:', error.message);
    }

    // Load Recent Diary Entries
    try {
      const recentEntries = await base44.asServiceRole.entities.GrowDiaryEntry.filter({
        created_by: user.email
      }, '-created_date', 10);
      
      if (recentEntries.length > 0) {
        context.grow_history.recent_entries = recentEntries.slice(0, 5).map(entry => ({
          date: entry.created_date,
          stage: entry.growth_stage,
          observations: entry.plant_observation,
          health: entry.ai_analysis?.health_assessment
        }));

        // Extract common issues
        const issues = new Set();
        recentEntries.forEach(entry => {
          if (entry.ai_analysis?.detected_issues) {
            entry.ai_analysis.detected_issues.forEach(issue => {
              issues.add(issue.issue_type);
            });
          }
        });
        context.grow_history.common_issues = Array.from(issues).slice(0, 5);
      }
    } catch (error) {
      console.error('Error loading entries:', error.message);
    }

    // Analyze Favorite Strains
    try {
      const allDiaries = await base44.asServiceRole.entities.GrowDiary.filter({
        created_by: user.email
      }, '-created_date', 50);
      
      const strainCounts = {};
      allDiaries.forEach(diary => {
        if (diary.strain_name) {
          strainCounts[diary.strain_name] = (strainCounts[diary.strain_name] || 0) + 1;
        }
      });
      
      context.grow_history.favorite_strains = Object.entries(strainCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([strain]) => strain);
    } catch (error) {
      console.error('Error analyzing strains:', error.message);
    }

    return Response.json({
      success: true,
      context
    });

  } catch (error) {
    console.error('Error getting user context:', error);
    return Response.json({
      error: error.message
    }, { status: 500 });
  }
});

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 6) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  if (hour < 22) return 'evening';
  return 'night';
}