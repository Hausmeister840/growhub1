import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const lastActive = user.last_active_date ? new Date(user.last_active_date).toISOString().split('T')[0] : null;

    let streak = user.streak || 0;
    let isNewStreak = false;

    if (!lastActive) {
      streak = 1;
      isNewStreak = true;
    } else if (lastActive === today) {
      return Response.json({ 
        streak, 
        isNewStreak: false,
        message: 'Already active today' 
      });
    } else {
      const lastActiveDate = new Date(lastActive);
      const daysDiff = Math.floor((now - lastActiveDate) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        streak += 1;
        isNewStreak = true;
      } else {
        streak = 1;
        isNewStreak = true;
      }
    }

    await base44.asServiceRole.entities.User.update(user.id, {
      streak,
      last_active_date: now.toISOString()
    });

    return Response.json({
      streak,
      isNewStreak,
      message: isNewStreak ? `Streak updated to ${streak}` : 'Already active today'
    });

  } catch (error) {
    console.error('Streak touch error:', error);
    return Response.json({ 
      error: error.message,
      streak: 0 
    }, { status: 500 });
  }
});