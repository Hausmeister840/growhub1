import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * 🔔 PUSH NOTIFICATION SERVICE
 * Sendet Push-Benachrichtigungen an Nutzer
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const body = await req.json();
    const { user_email, title, message, type, action_url, priority = 'normal' } = body;

    if (!user_email || !title || !message) {
      return Response.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Prüfe User-Präferenzen
    const users = await base44.entities.User.filter({ email: user_email });
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const user = users[0];
    const preferences = user.preferences || {};

    // Prüfe ob Benachrichtigungen erlaubt
    if (preferences.push_notifications === false) {
      return Response.json({ 
        success: false, 
        reason: 'User disabled push notifications' 
      });
    }

    const webhookUrl = Deno.env.get('PUSH_WEBHOOK_URL');
    let deliveryStatus = 'queued';

    // Optional: external provider delivery (e.g. OneSignal relay).
    if (webhookUrl) {
      try {
        const providerRes = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_email,
            title,
            message,
            type,
            action_url: action_url || '',
            priority,
          }),
        });

        deliveryStatus = providerRes.ok ? 'sent' : 'failed';
      } catch (providerError) {
        console.warn('Push provider request failed:', providerError?.message || providerError);
        deliveryStatus = 'failed';
      }
    }

    // Erstelle Notification Record
    const notification = await base44.entities.PushNotification.create({
      user_email,
      title,
      body: message,
      type,
      action_url: action_url || '',
      priority,
      status: deliveryStatus,
      sent_at: new Date().toISOString()
    });

    console.log(`📤 Push notification sent: ${title} -> ${user_email}`);

    return Response.json({
      success: true,
      notification_id: notification.id
    });

  } catch (error) {
    console.error('Push notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});