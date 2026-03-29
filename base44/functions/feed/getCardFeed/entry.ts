import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { cursor, limit = 20, filters = {} } = await req.json();

        const baseFilters = {
            '$or': [
                { post_type: { '$in': ['general', 'question', 'tutorial', 'review'] }},
                { media_urls: { '$size': 0 } }, // Text-only posts
                { 'media_urls.0': { '$regex': '\\.(jpg|jpeg|png|gif|webp)$' } } // Images
            ],
            moderation_status: 'approved',
            ...filters
        };

        if (cursor) {
            baseFilters.created_date = { '$lt': cursor };
        }

        const posts = await base44.entities.Post.filter(
            baseFilters,
            '-engagement_score,-created_date',
            limit + 1
        );

        const hasMore = posts.length > limit;
        const items = hasMore ? posts.slice(0, limit) : posts;
        
        // Enrich with user data
        const authorIds = [...new Set(items.map(p => p.created_by))];
        const authors = await base44.entities.User.filter({ 
            id: { '$in': authorIds } 
        });
        const authorMap = new Map(authors.map(a => [a.id, a]));
        
        const enrichedItems = items.map(post => ({
            ...post,
            user: authorMap.get(post.created_by) || null
        }));

        return Response.json({
            items: enrichedItems,
            nextCursor: items.length > 0 ? items[items.length - 1].created_date : null,
            hasMore
        });

    } catch (error) {
        console.error('getCardFeed error:', error);
        return Response.json({
            error: 'Failed to fetch card feed',
            items: [],
            hasMore: false
        }, { status: 500 });
    }
});