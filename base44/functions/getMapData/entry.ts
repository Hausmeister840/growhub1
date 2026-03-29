import { createClientFromRequest } from 'npm:@base44/sdk@0.7.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const { bounds, filters = [], include_compliance = true } = await req.json().catch(() => ({}));
        const hasValidBounds = Boolean(
            bounds &&
            Number.isFinite(Number(bounds.south)) &&
            Number.isFinite(Number(bounds.north)) &&
            Number.isFinite(Number(bounds.west)) &&
            Number.isFinite(Number(bounds.east))
        );

        console.log('🗺️ Loading map data:', { bounds, filters, include_compliance });

        let locations = [];
        let complianceZones = [];

        try {
            // Load GrowHub locations from Club entity
            let clubQuery = {};
            
            // Apply type filters
            if (filters.length > 0) {
                clubQuery.club_type = { '$in': filters };
            }

            // Apply geographic bounds if provided
            if (hasValidBounds) {
                clubQuery.latitude = { '$gte': Number(bounds.south), '$lte': Number(bounds.north) };
                clubQuery.longitude = { '$gte': Number(bounds.west), '$lte': Number(bounds.east) };
            }

            locations = await base44.entities.Club.filter(clubQuery, '-created_date', 500);
            console.log(`📍 Loaded ${locations.length} locations`);

            // Load compliance zones if requested
            if (include_compliance) {
                let complianceQuery = {};
                
                if (hasValidBounds) {
                    complianceQuery.latitude = { '$gte': Number(bounds.south), '$lte': Number(bounds.north) };
                    complianceQuery.longitude = { '$gte': Number(bounds.west), '$lte': Number(bounds.east) };
                }

                try {
                    complianceZones = await base44.entities.NoGoZone.filter(complianceQuery, '-created_date', 200);
                    complianceZones = complianceZones.filter((zone) => zone?.is_active !== false);
                    console.log(`🛡️ Loaded ${complianceZones.length} compliance zones`);
                } catch (complianceError) {
                    console.warn('Failed to load compliance zones:', complianceError);
                    complianceZones = [];
                }
            }

            return Response.json({
                success: true,
                data: {
                    locations,
                    complianceZones,
                    summary: {
                        locations_count: locations.length,
                        compliance_zones_count: complianceZones.length,
                        bounds: hasValidBounds ? bounds : null
                    }
                }
            });

        } catch (queryError) {
            console.error('Database query failed:', queryError);
            return Response.json({
                success: false,
                error: 'Database query failed',
                details: queryError.message
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Map data error:', error);
        return Response.json({
            success: false,
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
});