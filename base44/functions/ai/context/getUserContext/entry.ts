import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * 🎯 GET USER CONTEXT
 * Sammelt relevanten User-Kontext für personalisierte KI-Antworten
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get current user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Gather comprehensive user context
    const context = {
      // User Profile
      profile: {
        name: user.full_name,
        username: user.username,
        email: user.email,
        grow_level: user.grow_level || 'beginner',
        interests: user.interests || [],
        location: user.location,
        xp: user.xp || 0,
        badges: user.badges || []
      },

      // Grow History
      grow_history: {
        active_diaries: [],
        completed_diaries: [],
        total_grows: 0,
        favorite_strains: [],
        common_issues: []
      },

      // Recent Activity
      recent_activity: {
        last_post_date: null,
        last_diary_entry: null,
        active_challenges: []
      },

      // Preferences (would come from settings)
      preferences: {
        communication_style: 'friendly', // casual, professional, technical
        detail_level: 'moderate', // brief, moderate, detailed
        proactive_tips: true
      }
    };

    // Load active grow diaries
    try {
      const diaries = await base44.asServiceRole.entities.GrowDiary.filter({
        created_by: user.email,
        status: 'active'
      }, '-created_date', 10);
      
      context.grow_history.active_diaries = diaries.map(d => ({
        id: d.id,
        name: d.name,
        strain: d.strain_name,
        stage: d.current_stage,
        days: d.stats?.total_days || 0,
        issues: d.stats?.issues_count || 0
      }));
      
      context.grow_history.total_grows = diaries.length;
    } catch (error) {
      console.error('Error loading diaries:', error);
    }

    // Load recent diary entries for context
    try {
      const recentEntries = await base44.asServiceRole.entities.GrowDiaryEntry.filter({
        created_by: user.email
      }, '-created_date', 5);
      
      if (recentEntries.length > 0) {
        context.recent_activity.last_diary_entry = {
          date: recentEntries[0].created_date,
          stage: recentEntries[0].growth_stage,
          observations: recentEntries[0].plant_observation
        };

        // Extract common issues
        const issues = [];
        recentEntries.forEach(entry => {
          if (entry.ai_analysis?.detected_issues) {
            entry.ai_analysis.detected_issues.forEach(issue => {
              if (!issues.includes(issue.issue_type)) {
                issues.push(issue.issue_type);
              }
            });
          }
        });
        context.grow_history.common_issues = issues;
      }
    } catch (error) {
      console.error('Error loading recent entries:', error);
    }

    // Load favorite strains (most used)
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
        .slice(0, 5)
        .map(([strain]) => strain);
    } catch (error) {
      console.error('Error analyzing strains:', error);
    }

    // Load active challenges
    try {
      const challenges = await base44.asServiceRole.entities.Challenge.filter({
        target_user_email: user.email,
        status: 'active'
      }, '-created_date', 5);
      
      context.recent_activity.active_challenges = challenges.map(c => ({
        title: c.title,
        progress: c.current_progress,
        target: c.target_count,
        expires: c.end_date
      }));
    } catch (error) {
      console.error('Error loading challenges:', error);
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