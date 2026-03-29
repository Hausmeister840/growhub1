import { createClientFromRequest } from 'npm:@base44/sdk@0.7.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { location_id, action = 'add' } = await req.json();

        if (!location_id) {
            return Response.json({ error: 'location_id is required' }, { status: 400 });
        }

        console.log('⭐ Updating location favorites:', { user: user.email, location_id, action });

        try {
            // Get the location
            const locations = await base44.entities.Club.filter({ id: location_id });
            
            if (locations.length === 0) {
                return Response.json({ error: 'Location not found' }, { status: 404 });
            }

            const location = locations[0];
            const currentFavorites = Array.isArray(location.favorited_by_users) ? location.favorited_by_users : [];

            let updatedFavorites;
            let isFavorited;

            if (action === 'add') {
                if (!currentFavorites.includes(user.email)) {
                    updatedFavorites = [...currentFavorites, user.email];
                    isFavorited = true;
                } else {
                    updatedFavorites = currentFavorites;
                    isFavorited = true;
                }
            } else if (action === 'remove') {
                updatedFavorites = currentFavorites.filter(email => email !== user.email);
                isFavorited = false;
            } else {
                return Response.json({ error: 'Invalid action. Use "add" or "remove"' }, { status: 400 });
            }

            // Update the location
            await base44.entities.Club.update(location_id, {
                favorited_by_users: updatedFavorites
            });

            console.log('✅ Location favorites updated:', { location_id, favorites_count: updatedFavorites.length });

            return Response.json({
                success: true,
                data: {
                    location_id,
                    is_favorited: isFavorited,
                    favorites_count: updatedFavorites.length,
                    action: action
                }
            });

        } catch (updateError) {
            console.error('Failed to update location favorites:', updateError);
            return Response.json({
                success: false,
                error: 'Failed to update favorites',
                details: updateError.message
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Add location to favorites error:', error);
        return Response.json({
            success: false,
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
});