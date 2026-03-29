import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * 📊 TRACK EVENT
 * Stores analytics events
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);

    const { events } = await req.json();

    if (!Array.isArray(events) || events.length === 0) {
      return Response.json({ 
        error: 'Invalid events array' 
      }, { status: 400 });
    }

    // Enrich events with user info
    const enrichedEvents = events.map(event => ({
      ...event,
      user_email: user?.email || event.user_email || 'anonymous',
      device_type: getDeviceType(req),
      network_type: event.network_type || 'unknown',
      meta: {
        ...event.meta,
        user_agent: req.headers.get('user-agent'),
        ip: req.headers.get('x-forwarded-for') || 'unknown'
      }
    }));

    // Bulk insert
    await base44.asServiceRole.entities.UserActivity.bulkCreate(enrichedEvents);

    return Response.json({ 
      success: true, 
      count: enrichedEvents.length 
    });

  } catch (error) {
    console.error('Track event error:', error);
    return Response.json({ 
      error: 'Failed to track events',
      details: error.message 
    }, { status: 500 });
  }
});

function getDeviceType(req) {
  const ua = req.headers.get('user-agent') || '';
  if (/mobile/i.test(ua)) return 'mobile';
  if (/tablet/i.test(ua)) return 'tablet';
  return 'desktop';
}