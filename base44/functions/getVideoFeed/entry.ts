import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    console.log('🎬 getVideoFeed called - SIMPLE VERSION');
    
    try {
        const base44 = createClientFromRequest(req);
        let requestBody = {};
        
        try {
            requestBody = await req.json();
        } catch (e) {
            console.log('Using default request body');
        }
        
        const { limit = 10 } = requestBody;
        console.log('Limit:', limit);

        // ✅ EINFACHSTE MÖGLICHE ABFRAGE - NUR POSTS, KEINE BENUTZER
        let posts = [];
        try {
            posts = await base44.asServiceRole.entities.Post.list('-created_date', parseInt(limit));
            console.log('📦 Raw posts found:', posts.length);
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
            console.log('⚠️ No posts found');
            return new Response(JSON.stringify({
                ok: true,
                posts: []
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // ✅ POSTS MIT STANDARD-BENUTZER ZURÜCKGEBEN (KEINE DATENBANKABFRAGE)
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

        console.log('✅ Returning posts with default users:', enrichedPosts.length);

        return new Response(JSON.stringify({
            ok: true,
            posts: enrichedPosts
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('❌ getVideoFeed error:', error);
        
        return new Response(JSON.stringify({
            ok: false,
            error: 'video_feed_failed',
            message: error.message || 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});