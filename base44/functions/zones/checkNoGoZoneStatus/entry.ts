import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userLat, userLng } = await req.json();

        if (typeof userLat !== 'number' || typeof userLng !== 'number') {
            return Response.json({ error: 'Invalid coordinates' }, { status: 400 });
        }

        function calculateDistance(lat1, lng1, lat2, lng2) {
            const R = 6371e3;
            const φ1 = lat1 * Math.PI / 180;
            const φ2 = lat2 * Math.PI / 180;
            const Δφ = (lat2 - lat1) * Math.PI / 180;
            const Δλ = (lng2 - lng1) * Math.PI / 180;

            const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                      Math.cos(φ1) * Math.cos(φ2) *
                      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

            return R * c;
        }

        const noGoZones = await base44.entities.NoGoZone.list();
        const clubs = await base44.entities.Club.list();

        let isInZone = false;
        let activeZoneInfo = null;

        const now = new Date();
        const currentDay = now.getDay();
        const currentHour = now.getHours();

        for (const zone of noGoZones) {
            const distance = calculateDistance(userLat, userLng, zone.latitude, zone.longitude);
            if (distance < (zone.radius_meters || 100)) {
                let zoneIsActive = true;
                if (zone.active_rule) {
                    if (zone.active_rule.days && !zone.active_rule.days.includes(currentDay)) {
                        zoneIsActive = false;
                    }
                    if (zone.active_rule.time_window) {
                        const [startHour, endHour] = zone.active_rule.time_window.split('-').map(Number);
                        if (currentHour < startHour || currentHour >= endHour) {
                            zoneIsActive = false;
                        }
                    }
                }

                if (zoneIsActive) {
                    isInZone = true;
                    activeZoneInfo = zone;
                    break;
                }
            }
        }

        let suggestedSafeSpots = [];
        if (isInZone) {
            const potentialSafeSpots = clubs.filter(club => {
                for (const zone of noGoZones) {
                    const distance = calculateDistance(club.latitude, club.longitude, zone.latitude, zone.longitude);
                    if (distance < (zone.radius_meters || 100)) {
                        return false;
                    }
                }
                return true;
            });

            suggestedSafeSpots = potentialSafeSpots
                .map(club => ({
                    ...club,
                    distance: calculateDistance(userLat, userLng, club.latitude, club.longitude)
                }))
                .sort((a, b) => a.distance - b.distance)
                .slice(0, 3)
                .map(club => ({
                    name: club.name,
                    latitude: club.latitude,
                    longitude: club.longitude,
                    type: club.club_type,
                    distance: club.distance
                }));
        }

        return Response.json({ isInZone, activeZoneInfo, suggestedSafeSpots });

    } catch (error) {
        console.error('Error in checkNoGoZoneStatus:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});