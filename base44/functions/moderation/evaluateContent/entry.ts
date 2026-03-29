import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * 🛡️ CONTENT EVALUATION
 * Erweiterte Moderation mit Location Check
 */

Deno.serve(async (req) => {
  try {
    const { post_id, content, location, media_urls = [] } = await req.json();
    
    if (!post_id) {
      return Response.json({ error: 'Post ID required' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    let moderationResult = {
      action: 'allow',
      sensitive: false,
      warnings: [],
      zone_info: null,
      confidence: 1.0
    };

    // ✅ Location-based NoGo zone check
    if (location && location.latitude && location.longitude) {
      try {
        const zoneCheckResponse = await base44.functions.invoke('zones/isInNoGoZone', {
          lat: location.latitude,
          lng: location.longitude
        });
        
        if (zoneCheckResponse?.data?.in_zone && zoneCheckResponse.data.matches?.length > 0) {
          const primaryMatch = zoneCheckResponse.data.matches[0];
          
          moderationResult.action = 'warn';
          moderationResult.sensitive = true;
          moderationResult.zone_info = {
            in_nogo_zone: true,
            zone_kind: primaryMatch.kind,
            zone_name: primaryMatch.name,
            distance_m: primaryMatch.distance_m,
            legal_basis: primaryMatch.legal_basis,
            rule: primaryMatch.rule,
            matches: zoneCheckResponse.data.matches
          };
          
          moderationResult.warnings.push({
            type: 'location_restriction',
            message: `Post erstellt in Schutzzone (${getZoneTypeLabel(primaryMatch.kind)})`,
            details: `${primaryMatch.legal_basis} - Öffentlicher Konsum hier verboten`,
            severity: 'high'
          });
        }
      } catch (zoneError) {
        console.warn('Zone check failed:', zoneError);
      }
    }

    // ✅ Content-based moderation
    if (content) {
      const cannabisKeywords = [
        'rauchen', 'joint', 'kiffen', 'cannabis', 'hanf', 'weed', 'gras', 
        'bubatz', 'tüte', 'session', 'high', 'stoned', 'konsum'
      ];
      
      const contentLower = content.toLowerCase();
      const hasCannabisMention = cannabisKeywords.some(keyword => 
        contentLower.includes(keyword)
      );
      
      // Escalate to block if cannabis content + NoGo zone
      if (hasCannabisMention && moderationResult.zone_info?.in_nogo_zone) {
        moderationResult.action = 'block';
        moderationResult.warnings.push({
          type: 'content_location_violation',
          message: 'Cannabis-Konsum-Inhalte in Schutzzone nicht erlaubt',
          details: 'Bitte respektiere die gesetzlichen Bestimmungen zu Cannabis-Schutzzonen',
          severity: 'critical'
        });
      }
    }

    // ✅ Update post with moderation result
    try {
      await base44.asServiceRole.entities.Post.update(post_id, {
        sensitive: moderationResult.sensitive,
        content_warning: moderationResult.warnings.length > 0 ? moderationResult.warnings[0].message : null,
        moderation_notes: JSON.stringify({
          auto_moderated: true,
          moderated_at: new Date().toISOString(),
          result: moderationResult
        })
      });
    } catch (updateError) {
      console.warn('Failed to update post moderation status:', updateError);
    }

    return Response.json({
      success: true,
      result: moderationResult
    });
    
  } catch (error) {
    console.error('Content evaluation failed:', error);
    return Response.json({ 
      error: 'Content evaluation failed',
      details: error.message 
    }, { status: 500 });
  }
});

function getZoneTypeLabel(kind) {
  const labels = {
    school: 'Schule',
    kita: 'Kindergarten', 
    youth: 'Jugendeinrichtung',
    playground: 'Spielplatz',
    sports: 'Sportstätte',
    pedestrian_zone: 'Fußgängerzone',
    grow_association: 'Anbauvereinigung'
  };
  return labels[kind] || 'Schutzzone';
}