import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const streak = user.streak || 0;
    const lastActiveDate = user.last_active_date || null;

    return Response.json({
      streak,
      lastActiveDate,
      isActiveToday: lastActiveDate 
        ? new Date(lastActiveDate).toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
        : false
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      streak: 0 
    }, { status: 500 });
  }
});