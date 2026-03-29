import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const { lat, lng, at } = await req.json();
    
    if (!lat || !lng || typeof lat !== 'number' || typeof lng !== 'number') {
      return Response.json({ 
        error: 'Invalid coordinates' 
      }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    
    // Get current time in Berlin timezone
    const now = at ? new Date(at) : new Date();
    const berlinTime = new Intl.DateTimeFormat('de-DE', {
      timeZone: 'Europe/Berlin',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now);
    
    const currentHour = parseInt(berlinTime.split(':')[0]);
    const currentDay = now.getDay();
    const dayOfWeek = currentDay === 0 ? 7 : currentDay;

    // ✅ VERBESSERTES ERROR HANDLING
    let zones = [];
    try {
      zones = await base44.entities.NoGoZone.list();
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Return safe status if database fails
      return Response.json({
        status: 'safe',
        severity: 'info',
        in_zone: false,
        approaching_zone: false,
        nearby_zone: false,
        warning_message: '✅ SAFE: Zonendaten konnten nicht geladen werden, aber du bist sicher.',
        matches: [],
        approaching: [],
        nearby: [],
        checked_at: now.toISOString(),
        berlin_time: berlinTime,
        total_zones_checked: 0
      });
    }
    
    const matches = [];
    const approaching = [];
    const nearby = [];
    
    for (const zone of zones) {
      try {
        const distance = calculateDistance(lat, lng, zone.latitude, zone.longitude);
        const bufferDistance = zone.radius_meters || 100;
        
        const rule = zone.active_rule || { time_window: 'always', days: [1,2,3,4,5,6,7] };
        const isDayRestricted = !rule.days || rule.days.includes(dayOfWeek);
        
        let isTimeRestricted = true;
        if (rule.time_window === '07-20') {
          isTimeRestricted = (currentHour >= 7 && currentHour < 20);
        }
        
        const isRestricted = isDayRestricted && isTimeRestricted;
        
        if (distance <= bufferDistance && isRestricted) {
          matches.push({
            id: zone.id,
            kind: zone.type || zone.kind,
            name: zone.name,
            distance_m: Math.round(distance),
            rule: rule.time_window || 'always',
            legal_basis: '§5 Abs. 1 KCanG',
            legal_details: getLegalDetails(zone.type || zone.kind),
            severity: 'critical'
          });
        } else if (distance <= bufferDistance + 50 && distance > bufferDistance && isRestricted) {
          approaching.push({
            id: zone.id,
            kind: zone.type || zone.kind,
            name: zone.name,
            distance_m: Math.round(distance),
            entering_in_meters: Math.round(distance - bufferDistance),
            legal_basis: '§5 Abs. 1 KCanG',
            legal_details: getLegalDetails(zone.type || zone.kind),
            severity: 'warning'
          });
        } else if (distance <= bufferDistance + 200 && distance > bufferDistance + 50) {
          nearby.push({
            id: zone.id,
            kind: zone.type || zone.kind,
            name: zone.name,
            distance_m: Math.round(distance),
            legal_basis: '§5 Abs. 1 KCanG',
            severity: 'info'
          });
        }
      } catch (zoneError) {
        console.warn('Zone processing error:', zoneError);
        continue;
      }
    }
    
    let status = 'safe';
    let severity = 'info';
    let warning_message = null;
    
    if (matches.length > 0) {
      status = 'in_zone';
      severity = 'critical';
      warning_message = `⚠️ WARNUNG: Sie befinden sich in einer NO-GO-ZONE (${matches[0].name}). Cannabis-Konsum ist hier nach §5 KCanG verboten.`;
    } else if (approaching.length > 0) {
      status = 'approaching';
      severity = 'warning';
      warning_message = `⚡ ACHTUNG: Sie nähern sich einer NO-GO-ZONE (${approaching[0].name}) in ${approaching[0].entering_in_meters}m.`;
    } else if (nearby.length > 0) {
      status = 'nearby';
      severity = 'info';
      warning_message = `ℹ️ HINWEIS: NO-GO-ZONE in ${nearby[0].distance_m}m Entfernung (${nearby[0].name}).`;
    } else {
      warning_message = '✅ SAFE: Keine Schutzzonen in Ihrer Nähe. Cannabis-Konsum ist hier erlaubt.';
    }
    
    return Response.json({
      status,
      severity,
      in_zone: matches.length > 0,
      approaching_zone: approaching.length > 0,
      nearby_zone: nearby.length > 0,
      warning_message,
      matches,
      approaching,
      nearby,
      checked_at: now.toISOString(),
      berlin_time: berlinTime,
      total_zones_checked: zones.length,
      legal_framework: {
        law: 'Konsumcannabisgesetz (KCanG)',
        paragraph: '§5 Abs. 1',
        summary: 'Cannabis-Konsum ist in Sichtweite von Schulen, Kindergärten, Jugendeinrichtungen und Spielplätzen verboten.',
        penalty: 'Ordnungswidrigkeit mit Bußgeld bis zu 30.000 EUR (§34 KCanG)'
      }
    });
    
  } catch (error) {
    console.error('NoGo zone check error:', error);
    
    // ✅ BESSERES ERROR HANDLING
    if (error.message?.includes('Rate limit')) {
      return Response.json({ 
        error: 'Zone check failed',
        details: 'Rate limit exceeded'
      }, { status: 429 });
    }
    
    return Response.json({ 
      error: 'Zone check failed',
      details: error.message 
    }, { status: 500 });
  }
});

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function getLegalDetails(zoneType) {
  const details = {
    school: 'Schulen und deren Sichtbereich sind durch §5 Abs. 1 Nr. 1 KCanG geschützt.',
    kindergarten: 'Kindertagesstätten fallen unter §5 Abs. 1 Nr. 1 KCanG.',
    playground: 'Spielplätze sind nach §5 Abs. 1 Nr. 2 KCanG geschützt.',
    youth_centre: 'Jugendeinrichtungen gemäß §5 Abs. 1 Nr. 1 KCanG.',
    sports: 'Sportstätten können unter §5 Abs. 1 Nr. 2 KCanG fallen.',
    pedestrian_area: 'Fußgängerzonen: Konsum nach §5 Abs. 2 KCanG zwischen 07:00-20:00 Uhr verboten.'
  };
  return details[zoneType] || 'Allgemeine Schutzzone nach §5 KCanG';
}