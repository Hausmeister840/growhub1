import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    const base44 = createClientFromRequest(req);

    // This runs as a scheduled task — verify admin
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all active grow diaries with plans
    const diaries = await base44.asServiceRole.entities.GrowDiary.filter(
      { status: 'active' },
      '-created_date',
      500
    ).catch(() => []);

    let remindersSent = 0;
    let diariesChecked = 0;
    const now = Date.now();
    const REMINDER_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

    for (const diary of diaries) {
      if (!diary.grow_plan?.tasks?.length || !diary.notifications_enabled) continue;
      diariesChecked++;

      const overdueTasks = diary.grow_plan.tasks.filter(task => {
        if (!task.auto_remind || !task.next_due) return false;
        const dueTime = new Date(task.next_due).getTime();
        // Send reminder if overdue or due within 30 minutes
        return dueTime <= now + REMINDER_WINDOW_MS;
      });

      if (overdueTasks.length === 0) continue;

      // Get owner email
      const ownerEmail = diary.created_by;
      if (!ownerEmail) continue;

      // Build notification message
      const taskList = overdueTasks.map(t => {
        const isOverdue = new Date(t.next_due).getTime() < now;
        return `${isOverdue ? '⚠️' : '⏰'} ${t.title}: ${t.description}`;
      }).join('\n');

      const message = `🌱 ${diary.name} — ${overdueTasks.length} Aufgabe${overdueTasks.length > 1 ? 'n' : ''} fällig:\n${taskList}`;

      // Create in-app notification
      try {
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: ownerEmail,
          sender_email: 'system@growhub.app',
          sender_id: 'system',
          type: 'like', // reuse existing type, shown as system notification
          message,
          read: false,
        });
        remindersSent++;
      } catch (err) {
        console.error(`Failed to send reminder for diary ${diary.id}:`, err.message);
      }

      // Also send email for high priority overdue tasks
      const criticalTasks = overdueTasks.filter(t => t.priority === 'high' && new Date(t.next_due).getTime() < now - 3600000);
      if (criticalTasks.length > 0) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: ownerEmail,
            subject: `🌱 GrowHub: ${criticalTasks.length} überfällige Aufgabe${criticalTasks.length > 1 ? 'n' : ''} — ${diary.name}`,
            body: `<div style="font-family: -apple-system, sans-serif; color: #333; max-width: 500px;">
              <h2 style="color: #22c55e;">🌱 GrowHub Erinnerung</h2>
              <p><strong>${diary.name}</strong> (${diary.strain_name}) — ${diary.current_stage}</p>
              <hr style="border: 1px solid #eee;" />
              ${criticalTasks.map(t => `
                <div style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                  <strong>${t.title}</strong><br/>
                  <span style="color: #666; font-size: 14px;">${t.description}</span>
                </div>
              `).join('')}
              <p style="margin-top: 16px; color: #888; font-size: 13px;">
                Öffne GrowHub, um die Aufgaben als erledigt zu markieren.
              </p>
            </div>`,
          });
        } catch (emailErr) {
          console.error('Email reminder failed:', emailErr.message);
        }
      }
    }

    const processingTime = Date.now() - startTime;
    console.log(`Grow reminders: checked ${diariesChecked} diaries, sent ${remindersSent} reminders in ${processingTime}ms`);

    return Response.json({
      success: true,
      diariesChecked,
      remindersSent,
      processingTime,
    });

  } catch (error) {
    console.error('sendReminders error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});