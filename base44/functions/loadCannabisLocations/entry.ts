import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { bounds, types = [] } = await req.json().catch(() => ({}));

    console.log('🌿 Loading cannabis locations from database...');

    let query = {};
    
    if (types.length > 0) {
      query.club_type = { '$in': types };
    }

    if (bounds) {
      query.latitude = { '$gte': bounds.south, '$lte': bounds.north };
      query.longitude = { '$gte': bounds.west, '$lte': bounds.east };
    }

    const locations = await base44.entities.Club.filter(query, '-created_date', 500);

    console.log(`✅ Loaded ${locations.length} cannabis locations`);

    return Response.json({
      success: true,
      data: {
        locations,
        count: locations.length
      }
    });

  } catch (error) {
    console.error('Load cannabis locations error:', error);
    return Response.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
});