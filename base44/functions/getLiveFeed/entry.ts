import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    console.log('🚀 getLiveFeed called - SIMPLE VERSION');
    
    try {
        const base44 = createClientFromRequest(req);
        let requestBody = {};
        
        try {
            requestBody = await req.json();
        } catch (e) {
            console.log('Using default request body');
        }
        
        const { limit = 20 } = requestBody;

        // ✅ EINFACHSTE MÖGLICHE ABFRAGE
        let posts = [];
        try {
            posts = await base44.asServiceRole.entities.Post.list('-created_date', parseInt(limit));
            console.log('📦 Posts found:', posts.length);
        } catch (postError) {
            console.error('Post query failed:', postError);
            return new Response(JSON.stringify({
                ok: false,
                error: 'post_query_failed',
                message: postError.message
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!posts || posts.length === 0) {
            return new Response(JSON.stringify({
                ok: true,
                posts: []
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // ✅ POSTS MIT STANDARD-BENUTZER
        const enrichedPosts = posts.map(post => ({
            ...post,
            user: {
                email: post.created_by || 'unknown@example.com',
                full_name: 'Community Mitglied',
                avatar_url: null,
                grow_level: 'beginner',
                verified: false
            }
        }));

        return new Response(JSON.stringify({
            ok: true,
            posts: enrichedPosts
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('❌ getLiveFeed error:', error);
        
        return new Response(JSON.stringify({
            ok: false,
            error: 'live_feed_failed',
            message: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});