import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * 🗺️ LOAD GERMAN NO-GO ZONES
 * Lädt Schutzzonen aus OpenStreetMap für Deutschland
 */

const OSM_OVERPASS_API = 'https://overpass-api.de/api/interpreter';

const ZONE_QUERIES = {
  schools: `
    [out:json][timeout:25];
    area["ISO3166-1"="DE"][admin_level=2]->.boundaryarea;
    (
      node["amenity"="school"](area.boundaryarea);
      way["amenity"="school"](area.boundaryarea);
      relation["amenity"="school"](area.boundaryarea);
    );
    out center;
  `,
  kindergartens: `
    [out:json][timeout:25];
    area["ISO3166-1"="DE"][admin_level=2]->.boundaryarea;
    (
      node["amenity"="kindergarten"](area.boundaryarea);
      way["amenity"="kindergarten"](area.boundaryarea);
      relation["amenity"="kindergarten"](area.boundaryarea);
    );
    out center;
  `,
  playgrounds: `
    [out:json][timeout:25];
    area["ISO3166-1"="DE"][admin_level=2]->.boundaryarea;
    (
      node["leisure"="playground"](area.boundaryarea);
      way["leisure"="playground"](area.boundaryarea);
      relation["leisure"="playground"](area.boundaryarea);
    );
    out center;
  `,
  youth_centres: `
    [out:json][timeout:25];
    area["ISO3166-1"="DE"][admin_level=2]->.boundaryarea;
    (
      node["amenity"="community_centre"]["community_centre:for"="young_people"](area.boundaryarea);
      node["amenity"="youth_centre"](area.boundaryarea);
      way["amenity"="youth_centre"](area.boundaryarea);
    );
    out center;
  `
};

async function fetchFromOverpass(query) {
  try {
    const response = await fetch(OSM_OVERPASS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();
    return data.elements || [];
  } catch (error) {
    console.error('Overpass query failed:', error);
    return [];
  }
}

function getZoneType(tags) {
  if (tags.amenity === 'school') return 'school';
  if (tags.amenity === 'kindergarten') return 'kindergarten';
  if (tags.leisure === 'playground') return 'playground';
  if (tags.amenity === 'youth_centre') return 'youth_centre';
  return 'other';
}

function getActiveRule(zoneType) {
  // Spielplätze: 07:00-20:00 Uhr verboten
  if (zoneType === 'playground') {
    return {
      time_window: '07-20',
      days: [1, 2, 3, 4, 5, 6, 7] // Jeden Tag
    };
  }
  
  // Schulen, Kindergärten, Jugendeinrichtungen: Immer verboten in Sichtweite
  return {
    time_window: 'always',
    days: [1, 2, 3, 4, 5, 6, 7]
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ 
        error: 'Admin access required' 
      }, { status: 403 });
    }

    const { region, maxResults = 1000 } = await req.json().catch(() => ({}));

    console.log('🗺️ Loading NoGo zones for Germany...');

    let totalImported = 0;
    const results = {};

    // Load each zone type
    for (const [zoneType, query] of Object.entries(ZONE_QUERIES)) {
      console.log(`📍 Fetching ${zoneType}...`);
      
      try {
        const elements = await fetchFromOverpass(query);
        let imported = 0;

        for (const element of elements.slice(0, maxResults / 4)) {
          try {
            // Get coordinates
            let lat, lon;
            if (element.lat && element.lon) {
              lat = element.lat;
              lon = element.lon;
            } else if (element.center) {
              lat = element.center.lat;
              lon = element.center.lon;
            } else {
              continue;
            }

            const tags = element.tags || {};
            const name = tags.name || `${zoneType} (OSM ${element.id})`;
            const type = getZoneType(tags);

            // Check if already exists
            const existing = await base44.asServiceRole.entities.NoGoZone.filter({
              osm_id: `${element.type}/${element.id}`
            });

            if (existing.length > 0) {
              console.log(`⏭️ Skipping existing: ${name}`);
              continue;
            }

            // Create zone
            await base44.asServiceRole.entities.NoGoZone.create({
              name,
              type,
              latitude: lat,
              longitude: lon,
              radius_meters: 100, // 100m Schutzzone
              source: 'OpenStreetMap',
              osm_id: `${element.type}/${element.id}`,
              confidence: 0.9,
              active_rule: getActiveRule(type)
            });

            imported++;
          } catch (itemError) {
            console.warn('Failed to import zone:', itemError);
          }
        }

        results[zoneType] = {
          fetched: elements.length,
          imported
        };

        totalImported += imported;

        console.log(`✅ ${zoneType}: ${imported} imported`);

      } catch (typeError) {
        console.error(`Failed to load ${zoneType}:`, typeError);
        results[zoneType] = {
          error: typeError.message
        };
      }
    }

    return Response.json({
      success: true,
      total_imported: totalImported,
      results,
      message: `${totalImported} NoGo-Zonen erfolgreich importiert`
    });

  } catch (error) {
    console.error('Load NoGo zones failed:', error);
    return Response.json({ 
      error: 'Import fehlgeschlagen',
      details: error.message 
    }, { status: 500 });
  }
});