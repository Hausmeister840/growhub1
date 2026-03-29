import { createClientFromRequest } from 'npm:@base44/sdk@0.7.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { user_id, user_email, cursor, limit = 20, offset = 0, tab = 'posts' } = await req.json();

        if (!user_email) {
            return Response.json({ error: 'user_email is required' }, { status: 400 });
        }

        console.log('🔍 Loading profile feed:', { user_email, tab, limit, offset });

        const parsedLimit = Math.min(50, Math.max(1, Number(limit) || 20));
        const parsedOffset = Math.max(0, Number(offset) || 0);

        const targetUserArr = await base44.asServiceRole.entities.User.filter({ email: user_email }, '-created_date', 1);
        const targetUser = targetUserArr?.[0] || null;
        if (!targetUser) {
            return Response.json({ error: 'Target user not found' }, { status: 404 });
        }

        const isOwnProfile = user.email?.toLowerCase() === user_email.toLowerCase();
        let canSeeFriends = false;
        if (!isOwnProfile) {
            const follows = await base44.asServiceRole.entities.Follow.filter({
                follower_id: user.id,
                followee_id: targetUser.id,
                status: 'active'
            }).catch(() => []);
            canSeeFriends = (follows || []).length > 0;
        }

        const isVisibleToRequester = (post) => {
            const visibility = post?.visibility || 'public';
            if (isOwnProfile) return true;
            if (visibility === 'public') return true;
            if (visibility === 'friends') return canSeeFriends;
            return false;
        };

        let posts = [];
        let users = {};

        try {
            // Load posts based on tab
            switch (tab) {
                case 'posts': {
                    posts = await base44.asServiceRole.entities.Post.filter(
                        { created_by: user_email },
                        '-created_date',
                        Math.min(parsedOffset + parsedLimit, 200)
                    );
                    break;
                }

                case 'replies': {
                    // Get posts where user has commented
                    // This is a simplified approach - ideally we'd query Comment entity too
                    const allRecentPosts = await base44.asServiceRole.entities.Post.list('-created_date', Math.min((parsedOffset + parsedLimit) * 3, 300));
                    posts = allRecentPosts
                        .filter(post => post.created_by !== user_email && post.comments_count > 0)
                        .slice(parsedOffset, parsedOffset + parsedLimit);
                    break;
                }

                case 'media': {
                    posts = await base44.asServiceRole.entities.Post.filter(
                        { 
                            created_by: user_email,
                            media_urls: { '$exists': true, '$ne': [] }
                        },
                        '-created_date',
                        Math.min(parsedOffset + parsedLimit, 200)
                    );
                    break;
                }

                case 'bookmarks': {
                    posts = await base44.asServiceRole.entities.Post.filter(
                        { bookmarked_by_users: user_email },
                        '-created_date',
                        Math.min(parsedOffset + parsedLimit, 200)
                    );
                    break;
                }

                default: {
                    posts = await base44.asServiceRole.entities.Post.filter(
                        { created_by: user_email },
                        '-created_date',
                        Math.min(parsedOffset + parsedLimit, 200)
                    );
                    break;
                }
            }

            posts = (posts || []).filter(isVisibleToRequester).slice(parsedOffset, parsedOffset + parsedLimit);

            // Load users for posts
            if (posts.length > 0) {
                const uniqueUserEmails = [...new Set(posts.map(post => post.created_by))];
                const usersArray = await base44.asServiceRole.entities.User.filter({ 
                    email: { '$in': uniqueUserEmails } 
                });
                
                users = usersArray.reduce((acc, user) => {
                    acc[user.email] = user;
                    return acc;
                }, {});

                // Add target user if not already included
                if (!users[user_email]) {
                    try {
                        const targetUserArray = await base44.asServiceRole.entities.User.filter({ email: user_email });
                        if (targetUserArray.length > 0) {
                            users[user_email] = targetUserArray[0];
                        }
                    } catch (e) {
                        console.warn('Could not load target user:', e);
                    }
                }
            }

            console.log('✅ Profile feed loaded:', posts.length, 'posts');

            return Response.json({
                success: true,
                data: {
                    posts,
                    users,
                    hasMore: posts.length >= parsedLimit,
                    cursor: posts.length > 0 ? posts[posts.length - 1].id : null,
                    nextOffset: parsedOffset + posts.length
                }
            });

        } catch (queryError) {
            console.error('Query error:', queryError);
            return Response.json({
                error: 'Database query failed',
                details: queryError.message
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Profile feed error:', error);
        return Response.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
});