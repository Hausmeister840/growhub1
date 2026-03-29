import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { targetUserId, targetId } = await req.json();
        const targetIdValue = targetUserId || targetId;

        if (!targetIdValue || targetIdValue === user.id) {
            return Response.json({ error: 'Invalid target user' }, { status: 400 });
        }

        // Use service role for reliable querying (RLS can hide records)
        const existingFollows = await base44.asServiceRole.entities.Follow.filter({
            follower_id: user.id,
            followee_id: targetIdValue,
        });

        let following = false;
        const activeFollow = existingFollows.find(f => f.status === 'active');

        if (activeFollow) {
            // Unfollow: delete the relationship
            await base44.asServiceRole.entities.Follow.delete(activeFollow.id);
            following = false;
            
            // Update cached counts
            const targetUsers = await base44.asServiceRole.entities.User.filter({ id: targetIdValue });
            await Promise.all([
                base44.asServiceRole.entities.User.update(user.id, {
                    following_count: Math.max(0, (user.following_count || 0) - 1)
                }),
                targetUsers[0] ? base44.asServiceRole.entities.User.update(targetIdValue, {
                    followers_count: Math.max(0, (targetUsers[0].followers_count || 0) - 1)
                }) : Promise.resolve()
            ]);
        } else {
            // Clean up any stale non-active follows first
            for (const stale of existingFollows) {
                await base44.asServiceRole.entities.Follow.delete(stale.id).catch(() => {});
            }

            // Resolve target user email
            const targetUsers = await base44.asServiceRole.entities.User.filter({ id: targetIdValue });
            const targetEmail = targetUsers[0]?.email || '';

            // Follow: create the relationship using service role for reliability
            await base44.asServiceRole.entities.Follow.create({
                follower_id: user.id,
                followee_id: targetIdValue,
                follower_email: user.email,
                followee_email: targetEmail,
                status: 'active'
            });
            following = true;
            
            // Update cached counts
            await Promise.all([
                base44.asServiceRole.entities.User.update(user.id, {
                    following_count: (user.following_count || 0) + 1
                }),
                targetUsers[0] ? base44.asServiceRole.entities.User.update(targetIdValue, {
                    followers_count: (targetUsers[0].followers_count || 0) + 1
                }) : Promise.resolve()
            ]);
        }

        return Response.json({ 
            following,
            message: following ? 'Now following user' : 'Unfollowed user'
        });

    } catch (error) {
        console.error('toggleFollow error:', error);
        return Response.json({ 
            error: 'Failed to toggle follow status',
            details: error.message
        }, { status: 500 });
    }
});