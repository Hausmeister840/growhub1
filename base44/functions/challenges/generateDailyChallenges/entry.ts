
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * 🎮 DAILY CHALLENGE GENERATOR
 * Erstellt personalisierte Challenges für aktive User
 * Sollte täglich via Cron ausgeführt werden
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Admin only
    const authUser = await base44.auth.me();
    if (!authUser || authUser.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Hole alle aktiven User (letzte 7 Tage)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const allUsers = await base44.entities.User.filter({
      last_online_at: { '$gte': sevenDaysAgo.toISOString() }
    });

    console.log(`🎮 Generating challenges for ${allUsers.length} users...`);

    let created = 0;
    let skipped = 0;

    for (const user of allUsers) {
      try {
        // Prüfe ob User bereits aktive Challenges hat
        const activeChallenges = await base44.entities.Challenge.filter({
          target_user_email: user.email,
          status: 'active'
        });

        if (activeChallenges.length >= 3) {
          skipped++;
          continue; // Max 3 aktive Challenges
        }

        // Erstelle personalisierte Challenge
        const challenge = await generatePersonalizedChallenge(base44, user);
        if (challenge) {
          await base44.entities.Challenge.create(challenge);
          created++;

          // Send notification
          try {
            await base44.functions.invoke('notifications/sendPushNotification', {
              user_email: user.email,
              title: '🎯 Neue Challenge verfügbar!',
              message: challenge.title,
              type: 'challenge',
              priority: 'normal'
            });
          } catch (notifError) {
            console.warn('Failed to send challenge notification:', notifError);
          }
        }

      } catch (userError) {
        console.error(`Failed to generate challenge for ${user.email}:`, userError);
      }
    }

    return Response.json({
      success: true,
      stats: {
        total_users: allUsers.length,
        created,
        skipped
      }
    });

  } catch (error) {
    console.error('Challenge generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Generiere personalisierte Challenge
 */
async function generatePersonalizedChallenge(base44, user) {
  const userLevel = user.grow_level || 'beginner';
  const userXP = user.xp || 0;

  // Challenge Templates basierend auf Level
  const challengeTemplates = {
    beginner: [
      {
        title: '🌱 Erste Schritte',
        description: 'Vervollständige dein Profil mit Bio und Profilbild',
        challenge_type: 'social',
        target_count: 1,
        xp_reward: 50,
        icon_emoji: '🌱'
      },
      {
        title: '📝 Content Creator',
        description: 'Erstelle deinen ersten Post in der Community',
        challenge_type: 'post',
        target_count: 1,
        xp_reward: 30,
        icon_emoji: '✍️'
      },
      {
        title: '🤝 Community Member',
        description: 'Kommentiere 3 Posts von anderen Usern',
        challenge_type: 'comment',
        target_count: 3,
        xp_reward: 25,
        icon_emoji: '💬'
      }
    ],
    intermediate: [
      {
        title: '📈 Aktiver Grower',
        description: 'Erstelle 5 Posts diese Woche',
        challenge_type: 'post',
        target_count: 5,
        xp_reward: 100,
        icon_emoji: '🚀'
      },
      {
        title: '📖 Grow Diary Start',
        description: 'Starte dein erstes Grow Diary',
        challenge_type: 'growth',
        target_count: 1,
        xp_reward: 150,
        icon_emoji: '📓'
      },
      {
        title: '⭐ Hilfreicher Community Member',
        description: 'Erhalte 10 "Helpful" Reactions auf deine Kommentare',
        challenge_type: 'social',
        target_count: 10,
        xp_reward: 75,
        icon_emoji: '🌟'
      }
    ],
    expert: [
      {
        title: '🎓 Wissens-Experte',
        description: 'Erstelle einen Knowledge Article',
        challenge_type: 'knowledge',
        target_count: 1,
        xp_reward: 200,
        icon_emoji: '📚'
      },
      {
        title: '🔥 Streak Champion',
        description: 'Halte einen 7-Tage Login-Streak',
        challenge_type: 'streak',
        target_count: 7,
        xp_reward: 150,
        icon_emoji: '🔥'
      },
      {
        title: '👑 Community Leader',
        description: 'Hilf 20 Anfängern mit hilfreichen Kommentaren',
        challenge_type: 'social',
        target_count: 20,
        xp_reward: 250,
        icon_emoji: '👑'
      }
    ]
  };

  const templates = challengeTemplates[userLevel] || challengeTemplates.beginner;
  const template = templates[Math.floor(Math.random() * templates.length)];

  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  return {
    ...template,
    target_user_email: user.email,
    status: 'active',
    difficulty_level: userLevel === 'beginner' ? 'easy' : userLevel === 'expert' ? 'hard' : 'medium',
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    duration_days: 7,
    current_progress: 0,
    ai_generated: true
  };
}
