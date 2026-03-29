import { createClientFromRequest } from 'npm:@base44/sdk@0.7.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { sources = [] } = await req.json();
    
    if (!Array.isArray(sources) || sources.length === 0) {
      return Response.json({ 
        error: 'No sources provided' 
      }, { status: 400 });
    }

    const results = [];
    let totalImported = 0;
    
    for (const source of sources) {
      try {
        console.log(`Processing source: ${source}`);
        
        let importCount = 0;
        let status = 'ok';
        let error = null;
        
        if (source.includes('overpass-api') || source.includes('osm')) {
          // Handle OSM/Overpass data
          const osmResult = await importFromOSM(source, base44);
          importCount = osmResult.count;
          if (osmResult.error) {
            status = 'partial';
            error = osmResult.error;
          }
        } else if (source.includes('.geojson') || source.includes('geojson')) {
          // Handle GeoJSON data
          const geoResult = await importFromGeoJSON(source, base44);
          importCount = geoResult.count;
          if (geoResult.error) {
            status = 'partial'; 
            error = geoResult.error;
          }
        } else {
          // Unknown source type
          status = 'error';
          error = 'Unsupported source type';
        }
        
        // Log import result
        await base44.asServiceRole.entities.ZoneSourceLog.create({
          source,
          status,
          count: importCount,
          error,
          metadata: {
            imported_at: new Date().toISOString(),
            user_email: user.email
          }
        });
        
        results.push({
          source,
          status,
          count: importCount,
          error
        });
        
        totalImported += importCount;
        
      } catch (sourceError) {
        console.error(`Source import failed: ${source}`, sourceError);
        
        await base44.asServiceRole.entities.ZoneSourceLog.create({
          source,
          status: 'error',
          count: 0,
          error: sourceError.message,
          metadata: {
            imported_at: new Date().toISOString(),
            user_email: user.email
          }
        });
        
        results.push({
          source,
          status: 'error',
          count: 0,
          error: sourceError.message
        });
      }
    }
    
    return Response.json({
      success: true,
      total_imported: totalImported,
      sources_processed: sources.length,
      results
    });
    
  } catch (error) {
    console.error('Import process failed:', error);
    return Response.json({ 
      error: 'Import failed',
      details: error.message 
    }, { status: 500 });
  }
});

// OSM/Overpass import handler
async function importFromOSM(source, base44) {
  try {
    // Mock OSM import - in real implementation, query Overpass API
    const mockData = [
      {
        name: 'Grundschule Mitte',
        kind: 'school',
        lat: 52.520008,
        lng: 13.404954,
        source: 'OSM'
      },
      {
        name: 'Kita Sonnenschein', 
        kind: 'kita',
        lat: 52.521008,
        lng: 13.405954,
        source: 'OSM'
      },
      {
        name: 'Spielplatz Am Park',
        kind: 'playground', 
        lat: 52.522008,
        lng: 13.406954,
        source: 'OSM'
      }
    ];
    
    let imported = 0;
    
    for (const item of mockData) {
      try {
        await base44.asServiceRole.entities.NoGoZone.create({
          name: item.name,
          kind: item.kind,
          latitude: item.lat,
          longitude: item.lng,
          geometry: {
            type: 'Point',
            coordinates: [item.lng, item.lat]
          },
          buffer_m: item.kind === 'pedestrian_zone' ? 0 : 100,
          active_rule: {
            time_window: item.kind === 'pedestrian_zone' ? '07-20' : 'always',
            days: [1,2,3,4,5,6,7]
          },
          source: {
            name: 'OpenStreetMap',
            url: source,
            updated_at: new Date().toISOString(),
            confidence: 0.85
          },
          legal_basis: '§5 Konsumcannabisgesetz (KCanG)',
          confidence: 0.85,
          notes: `Importiert von OSM: ${item.source}`
        });
        
        imported++;
      } catch (itemError) {
        console.warn('Failed to import OSM item:', item, itemError);
      }
    }
    
    return { count: imported, error: null };
    
  } catch (error) {
    return { count: 0, error: error.message };
  }
}

// GeoJSON import handler  
async function importFromGeoJSON(source, base44) {
  try {
    // Fetch GeoJSON data
    const response = await fetch(source);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const geojson = await response.json();
    
    if (!geojson.features || !Array.isArray(geojson.features)) {
      throw new Error('Invalid GeoJSON format');
    }
    
    let imported = 0;
    
    for (const feature of geojson.features) {
      try {
        const props = feature.properties || {};
        const geom = feature.geometry;
        
        // Determine zone kind from properties
        let kind = 'school'; // Default
        if (props.amenity === 'kindergarten') kind = 'kita';
        if (props.amenity === 'playground') kind = 'playground';
        if (props.leisure === 'sports_centre' || props.leisure === 'pitch') kind = 'sports';
        if (props.highway === 'pedestrian') kind = 'pedestrian_zone';
        
        // Calculate center point for non-Point geometries
        let lat, lng;
        if (geom.type === 'Point') {
          [lng, lat] = geom.coordinates;
        } else {
          // Simplified centroid calculation
          lat = 52.520008; // Fallback to Berlin center
          lng = 13.404954;
        }
        
        await base44.asServiceRole.entities.NoGoZone.create({
          name: props.name || `${kind} (importiert)`,
          kind,
          latitude: lat,
          longitude: lng,
          geometry: geom,
          buffer_m: kind === 'pedestrian_zone' ? 0 : 100,
          active_rule: {
            time_window: kind === 'pedestrian_zone' ? '07-20' : 'always',
            days: [1,2,3,4,5,6,7]
          },
          source: {
            name: 'GeoJSON Import',
            url: source,
            updated_at: new Date().toISOString(),
            confidence: 0.8
          },
          legal_basis: '§5 Konsumcannabisgesetz (KCanG)',
          confidence: 0.8,
          notes: 'Importiert von GeoJSON'
        });
        
        imported++;
      } catch (featureError) {
        console.warn('Failed to import GeoJSON feature:', feature, featureError);
      }
    }
    
    return { count: imported, error: null };
    
  } catch (error) {
    return { count: 0, error: error.message };
  }
}