import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// ✅ ENHANCED CACHING SYSTEM
const CACHE_TTL = 300000; // 5 minutes
const requestCache = new Map();

function getCacheKey(cursor, limit, userId) {
    return `video_feed:${cursor || 'start'}:${limit}:${userId || 'anonymous'}`;
}

async function enrichPostsWithAuthors(base44, posts) {
    if (!posts.length) return posts;
    
    try {
        const authorEmails = [...new Set(posts.map(p => p.created_by).filter(Boolean))];
        if (authorEmails.length === 0) return posts;

        const authors = await base44.entities.User.filter({ 
            email: { '$in': authorEmails } 
        });
        
        const authorMap = new Map(authors.map(a => [a.email, a]));
        
        return posts.map(post => ({
            ...post,
            user: authorMap.get(post.created_by) || {
                email: post.created_by,
                full_name: 'GrowHub Member',
                avatar_url: null
            }
        }));
    } catch (error) {
        console.error('Failed to enrich posts with authors:', error);
        // Return posts with default user data
        return posts.map(post => ({
            ...post,
            user: {
                email: post.created_by,
                full_name: 'GrowHub Member',
                avatar_url: null
            }
        }));
    }
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        let currentUser = null;
        try {
            currentUser = await base44.auth.me();
        } catch (authError) {
            // Continue as anonymous user
        }

        const { cursor, limit = 20, userId } = await req.json();
        const cacheKey = getCacheKey(cursor, limit, userId || currentUser?.id);

        // ✅ CHECK CACHE FIRST
        const cached = requestCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return Response.json(cached.data);
        }

        console.log('🎬 Loading video feed:', { cursor, limit, user: currentUser?.email });

        // ✅ OPTIMIZED VIDEO POST QUERY
        const filters = {
            '$or': [
                // Posts explicitly marked as video type
                { post_type: 'video' },
                // Posts with video URLs in media_urls array
                { 
                    media_urls: { 
                        '$elemMatch': { 
                            '$regex': '\\.(mp4|mov|webm|avi|m4v|mkv)($|\\?)' 
                        } 
                    } 
                }
            ],
            // Only approved content
            moderation_status: { '$ne': 'rejected' },
            // Not deleted
            deleted_at: { '$exists': false }
        };

        if (cursor) {
            filters.created_date = { '$lt': cursor };
        }

        // Get posts with engagement-based sorting
        const posts = await base44.entities.Post.filter(
            filters, 
            '-engagement_score,-created_date', // Sort by engagement then recency
            limit + 1 // Get one extra to check hasMore
        );

        const hasMore = posts.length > limit;
        const items = hasMore ? posts.slice(0, limit) : posts;
        const nextCursor = items.length > 0 ? items[items.length - 1].created_date : null;

        // ✅ ENRICH WITH USER DATA
        const enrichedItems = await enrichPostsWithAuthors(base44, items);

        // ✅ ADDITIONAL PROCESSING FOR BETTER UX
        const processedItems = enrichedItems.map(item => ({
            ...item,
            // Ensure reactions object exists
            reactions: item.reactions || {},
            // Calculate engagement score if missing
            engagement_score: item.engagement_score || calculateEngagementScore(item),
            // Add video metadata
            video_metadata: extractVideoMetadata(item.media_urls)
        }));

        const result = {
            items: processedItems,
            nextCursor,
            hasMore,
            total: processedItems.length,
            cached: false
        };

        // ✅ CACHE THE RESULT
        requestCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });

        // ✅ CLEANUP OLD CACHE ENTRIES
        if (requestCache.size > 100) {
            const entries = Array.from(requestCache.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            entries.slice(0, 50).forEach(([key]) => requestCache.delete(key));
        }

        console.log('✅ Video feed loaded:', { count: processedItems.length, hasMore });
        return Response.json(result);

    } catch (error) {
        console.error('❌ getVideoFeed error:', error);
        return Response.json({
            error: 'Failed to fetch video feed',
            message: error.message,
            items: [],
            hasMore: false
        }, { status: 500 });
    }
});

// ✅ HELPER FUNCTIONS
function calculateEngagementScore(post) {
    const reactions = post.reactions || {};
    const totalReactions = Object.values(reactions).reduce((sum, r) => sum + (r.count || 0), 0);
    const comments = post.comments_count || 0;
    const shares = post.share_count || 0;
    const views = post.view_count || 0;
    
    const ageHours = (Date.now() - new Date(post.created_date).getTime()) / (1000 * 60 * 60);
    const recencyFactor = Math.max(0.1, 1 / (1 + ageHours * 0.1));
    
    return (totalReactions * 3 + comments * 5 + shares * 10 + views * 0.1) * recencyFactor;
}

function extractVideoMetadata(mediaUrls) {
    if (!Array.isArray(mediaUrls)) return null;
    
    const videoUrl = mediaUrls.find(url => 
        /\.(mp4|mov|webm|avi|m4v|mkv)($|\?)/i.test(url)
    );
    
    if (!videoUrl) return null;
    
    return {
        url: videoUrl,
        type: videoUrl.split('.').pop().split('?')[0].toLowerCase(),
        thumbnail: `${videoUrl}#t=0.1`
    };
}