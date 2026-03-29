import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * 🏆 LEADERBOARD UPDATE
 * Aktualisiert verschiedene Leaderboards
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const now = new Date();
    
    // WEEKLY LEADERBOARD
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    
    await updateTopGrowersLeaderboard(base44, 'weekly', weekStart, now);
    await updateBestContentLeaderboard(base44, 'weekly', weekStart, now);
    await updateStreakChampionsLeaderboard(base44, 'weekly');
    
    return Response.json({
      success: true,
      updated: ['top_growers', 'best_content', 'streak_champions']
    });

  } catch (error) {
    console.error('Leaderboard update error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function updateTopGrowersLeaderboard(base44, period, startDate, endDate) {
  // Hole User mit meisten XP/Reputation
  const users = await base44.entities.User.filter({});
  
  const sorted = users
    .sort((a, b) => (b.reputation_score || 0) - (a.reputation_score || 0))
    .slice(0, 50);

  const rankings = sorted.map((user, index) => ({
    rank: index + 1,
    user_email: user.email,
    score: user.reputation_score || 0,
    change: 0, // TODO: Calculate from previous period
    badge: index < 3 ? ['🥇', '🥈', '🥉'][index] : null
  }));

  // Update or create leaderboard
  const existing = await base44.entities.Leaderboard.filter({
    period,
    category: 'top_growers'
  });

  const data = {
    period,
    category: 'top_growers',
    period_start: startDate.toISOString(),
    period_end: endDate.toISOString(),
    rankings,
    last_updated: new Date().toISOString()
  };

  if (existing.length > 0) {
    await base44.entities.Leaderboard.update(existing[0].id, data);
  } else {
    await base44.entities.Leaderboard.create(data);
  }
}

async function updateBestContentLeaderboard(base44, period, startDate, endDate) {
  // Hole Posts mit besten Engagement
  const posts = await base44.entities.Post.filter({
    created_date: { '$gte': startDate.toISOString() }
  });

  const scoredPosts = posts.map(post => {
    const likes = Object.values(post.reactions || {})
      .reduce((sum, r) => sum + (r.count || 0), 0);
    const score = likes * 2 + (post.comments_count || 0) * 5 + (post.share_count || 0) * 10;
    return { ...post, score };
  });

  scoredPosts.sort((a, b) => b.score - a.score);
  
  const rankings = scoredPosts.slice(0, 50).map((post, index) => ({
    rank: index + 1,
    user_email: post.created_by,
    score: post.score,
    change: 0,
    badge: index < 3 ? ['🥇', '🥈', '🥉'][index] : null
  }));

  const existing = await base44.entities.Leaderboard.filter({
    period,
    category: 'best_content'
  });

  const data = {
    period,
    category: 'best_content',
    period_start: startDate.toISOString(),
    period_end: endDate.toISOString(),
    rankings,
    last_updated: new Date().toISOString()
  };

  if (existing.length > 0) {
    await base44.entities.Leaderboard.update(existing[0].id, data);
  } else {
    await base44.entities.Leaderboard.create(data);
  }
}

async function updateStreakChampionsLeaderboard(base44, period) {
  // Hole Streaks
  const streaks = await base44.entities.Streak.filter({
    streak_type: 'daily_visit'
  });

  streaks.sort((a, b) => (b.day_count || 0) - (a.day_count || 0));

  const rankings = streaks.slice(0, 50).map((streak, index) => ({
    rank: index + 1,
    user_email: streak.user_email,
    score: streak.day_count || 0,
    change: 0,
    badge: index < 3 ? ['🔥', '⚡', '💪'][index] : null
  }));

  const existing = await base44.entities.Leaderboard.filter({
    period,
    category: 'streak_champions'
  });

  const now = new Date();
  const data = {
    period,
    category: 'streak_champions',
    period_start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    period_end: now.toISOString(),
    rankings,
    last_updated: now.toISOString()
  };

  if (existing.length > 0) {
    await base44.entities.Leaderboard.update(existing[0].id, data);
  } else {
    await base44.entities.Leaderboard.create(data);
  }
}