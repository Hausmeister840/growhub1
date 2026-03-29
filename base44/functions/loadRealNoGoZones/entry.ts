import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { bounds, city = 'Berlin' } = await req.json().catch(() => ({}));

    console.log('🗺️ Loading real NoGo zones from OpenStreetMap...');

    // Overpass API Query für Deutschland
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["amenity"="school"](${bounds?.south || 52.4},${bounds?.west || 13.3},${bounds?.north || 52.6},${bounds?.east || 13.5});
        way["amenity"="school"](${bounds?.south || 52.4},${bounds?.west || 13.3},${bounds?.north || 52.6},${bounds?.east || 13.5});
        node["amenity"="kindergarten"](${bounds?.south || 52.4},${bounds?.west || 13.3},${bounds?.north || 52.6},${bounds?.east || 13.5});
        way["amenity"="kindergarten"](${bounds?.south || 52.4},${bounds?.west || 13.3},${bounds?.north || 52.6},${bounds?.east || 13.5});
        node["leisure"="playground"](${bounds?.south || 52.4},${bounds?.west || 13.3},${bounds?.north || 52.6},${bounds?.east || 13.5});
        way["leisure"="playground"](${bounds?.south || 52.4},${bounds?.west || 13.3},${bounds?.north || 52.6},${bounds?.east || 13.5});
        node["leisure"="sports_centre"](${bounds?.south || 52.4},${bounds?.west || 13.3},${bounds?.north || 52.6},${bounds?.east || 13.5});
        way["leisure"="sports_centre"](${bounds?.south || 52.4},${bounds?.west || 13.3},${bounds?.north || 52.6},${bounds?.east || 13.5});
        node["amenity"="community_centre"](${bounds?.south || 52.4},${bounds?.west || 13.3},${bounds?.north || 52.6},${bounds?.east || 13.5});
        way["amenity"="community_centre"](${bounds?.south || 52.4},${bounds?.west || 13.3},${bounds?.north || 52.6},${bounds?.east || 13.5});
      );
      out center;
    `;

    let zones = [];

    try {
      const overpassUrl = 'https://overpass-api.de/api/interpreter';
      const response = await fetch(overpassUrl, {
        method: 'POST',
        body: overpassQuery,
        headers: { 'Content-Type': 'text/plain' }
      });

      if (!response.ok) {
        throw new Error('Overpass API request failed');
      }

      const data = await response.json();
      console.log(`📍 Loaded ${data.elements?.length || 0} raw elements from OpenStreetMap`);

      // Convert to NoGo zones
      zones = data.elements.map(element => {
        let lat, lng;
        
        if (element.type === 'node') {
          lat = element.lat;
          lng = element.lon;
        } else if (element.center) {
          lat = element.center.lat;
          lng = element.center.lon;
        } else {
          return null;
        }

        const tags = element.tags || {};
        let type = 'other';
        
        if (tags.amenity === 'school') type = 'school';
        else if (tags.amenity === 'kindergarten') type = 'kindergarten';
        else if (tags.leisure === 'playground') type = 'playground';
        else if (tags.leisure === 'sports_centre') type = 'sports';
        else if (tags.amenity === 'community_centre') type = 'youth_centre';

        return {
          name: tags.name || `${type} (unbenannt)`,
          type,
          latitude: lat,
          longitude: lng,
          radius_meters: 100,
          source: 'OpenStreetMap',
          osm_id: element.id,
          confidence: 1.0
        };
      }).filter(Boolean);

      console.log(`✅ Converted to ${zones.length} NoGo zones`);

      // Save to database
      for (const zone of zones) {
        try {
          // Check if already exists
          const existing = await base44.entities.NoGoZone.filter({ osm_id: zone.osm_id });
          if (existing.length === 0) {
            await base44.asServiceRole.entities.NoGoZone.create(zone);
          }
        } catch (saveError) {
          console.warn('Failed to save zone:', saveError);
        }
      }

    } catch (overpassError) {
      console.error('Overpass API failed:', overpassError);
      return Response.json({
        success: false,
        error: 'Failed to load from OpenStreetMap',
        details: overpassError.message
      }, { status: 500 });
    }

    return Response.json({
      success: true,
      data: {
        zones,
        count: zones.length,
        source: 'OpenStreetMap via Overpass API'
      }
    });

  } catch (error) {
    console.error('Load zones error:', error);
    return Response.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
});