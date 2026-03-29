// 📊 CALCULATE FEED SCORES - ROBUST & OPTIMIZED VERSION
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// Simple in-memory cache to reduce computation
const scoreCache = new Map();
const CACHE_TTL = 300000; // 5 minutes cache

function getCacheKey(posts, activeTab, userId) {
    // Create a simple hash of the input for caching
    const postIds = posts.map(p => p.id).sort().join(',');
    return `scores:${activeTab}:${userId}:${postIds}`;
}

function getFromCache(key) {
    const cached = scoreCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    scoreCache.delete(key);
    return null;
}

function setCache(key, data) {
    // Keep cache size manageable
    if (scoreCache.size > 50) {
        const oldestKey = scoreCache.keys().next().value;
        scoreCache.delete(oldestKey);
    }
    
    scoreCache.set(key, {
        data,
        timestamp: Date.now()
    });
}

// Robust scoring algorithms
function calculateAIScore(post, currentUser) {
    try {
        if (!post || typeof post !== 'object') return 0;

        const reactions = post.reactions || {};
        const totalReactions = Object.values(reactions).reduce((sum, r) => {
            if (!r || typeof r !== 'object' || typeof r.count !== 'number') return sum;
            return sum + r.count;
        }, 0);

        const uniqueReactionTypes = Object.keys(reactions).filter((k) => {
            const reaction = reactions[k];
            return reaction && typeof reaction === 'object' && typeof reaction.count === 'number' && reaction.count > 0;
        }).length;

        const comments = post.comments_count || 0;
        const ageHours = Math.max(1, (Date.now() - new Date(post.created_date || Date.now()).getTime()) / (1000 * 60 * 60));
        const timeDecay = 1 / Math.pow(ageHours, 0.25);
        
        const hasVideo = post.media_urls && Array.isArray(post.media_urls) && 
            post.media_urls.some(url => /\.(mp4|webm|mov|avi|m4v)$/i.test(url));
        const hasImages = post.media_urls && Array.isArray(post.media_urls) && 
            post.media_urls.some(url => /\.(jpg|jpeg|png|gif|webp)$/i.test(url));
        const mediaBoost = hasVideo ? 1.35 : hasImages ? 1.15 : 1.0;

        const userInterests = currentUser && Array.isArray(currentUser.interests) ? currentUser.interests.map((s) => String(s).toLowerCase()) : [];
        const postTags = post.tags && Array.isArray(post.tags) ? post.tags.map((s) => String(s).toLowerCase()) : [];
        const interestMatches = postTags.filter((t) => userInterests.includes(t)).length;
        const interestBoost = 1 + Math.min(interestMatches, 3) * 0.15;

        const diversityBoost = 1 + Math.min(uniqueReactionTypes, 3) * 0.07;
        const pollBoost = post.poll ? 1.1 : 1.0;

        const base = totalReactions * 3 + comments * 2;
        const score = base * timeDecay * mediaBoost * interestBoost * diversityBoost * pollBoost;

        return Math.max(0, Math.round(score * 100) / 100);
    } catch (error) {
        console.error('Error calculating AI score:', error);
        return 0;
    }
}

function calculateViralScore(post, windowHours = 24) {
    try {
        if (!post || typeof post !== 'object') return 0;

        const reactions = post.reactions || {};
        const totalReactions = Object.values(reactions).reduce((sum, r) => {
            if (!r || typeof r !== 'object' || typeof r.count !== 'number') return sum;
            return sum + r.count;
        }, 0);

        const commentsWeight = (post.comments_count || 0) * 2.5;
        let ageHours = 1;

        try {
            if (post.created_date) {
                ageHours = Math.max(1, (Date.now() - new Date(post.created_date).getTime()) / (1000 * 60 * 60));
            }
        } catch (error) {
            console.warn('Date calculation error for post:', post.id);
        }

        // Only consider posts within the window
        if (ageHours > windowHours) {
            return 0;
        }

        const recency = 1 / Math.pow(ageHours, 0.2);
        const hasVideo = post.media_urls && Array.isArray(post.media_urls) && 
            post.media_urls.some(url => /\.(mp4|webm|mov|avi|m4v)$/i.test(url));
        const hasImages = post.media_urls && Array.isArray(post.media_urls) && 
            post.media_urls.some(url => /\.(jpg|jpeg|png|gif|webp)$/i.test(url));
        const mediaBonus = hasVideo ? 1.25 : hasImages ? 1.1 : 1.0;

        const viralScore = (totalReactions * 2.2 + commentsWeight + mediaBonus * 5 + 10) * recency;

        return Math.max(0, Math.round(viralScore * 100) / 100);
    } catch (error) {
        console.error('Error calculating viral score:', error);
        return 0;
    }
}

function calculateVideoTrendingScore(post) {
    try {
        if (!post || typeof post !== 'object') return 0;

        // Must have video content
        const hasVideo = post.media_urls && Array.isArray(post.media_urls) && 
            post.media_urls.some(url => /\.(mp4|webm|mov|avi|m4v)$/i.test(url));
        
        if (!hasVideo) return 0;

        const reactions = post.reactions || {};
        const totalReactions = Object.values(reactions).reduce((sum, r) => {
            if (!r || typeof r !== 'object' || typeof r.count !== 'number') return sum;
            return sum + r.count;
        }, 0);

        const commentsWeight = (post.comments_count || 0) * 2;
        const ageInHours = Math.max(1, (Date.now() - new Date(post.created_date || Date.now()).getTime()) / (1000 * 60 * 60));
        const recencyBoost = Math.max(0, 72 - ageInHours);
        const viewsEstimate = totalReactions * 15;
        const videoCount = post.media_urls.filter(url => /\.(mp4|webm|mov|avi|m4v)$/i.test(url)).length;
        const hasHashtags = post.tags && Array.isArray(post.tags) && post.tags.length > 0 ? 1.3 : 1.0;
        const isVeryRecent = ageInHours < 6 ? 1.5 : 1.0;
        const engagementRate = totalReactions > 0 ? (post.comments_count || 0) / totalReactions : 0;

        const videoTrendingScore = (
            totalReactions * 4 +
            commentsWeight * 1.5 +
            recencyBoost * 2 +
            viewsEstimate * 0.05 +
            videoCount * 10 +
            engagementRate * 20
        ) * hasHashtags * isVeryRecent;

        return Math.max(0, Math.round(videoTrendingScore * 100) / 100);
    } catch (error) {
        console.error('Error calculating video trending score:', error);
        return 0;
    }
}

Deno.serve(async (req) => {
    const startTime = Date.now();
    
    try {
        const base44 = createClientFromRequest(req);
        
        // Check authentication (optional for public content)
        let currentUser = null;
        try {
            currentUser = await base44.auth.me();
        } catch (authError) {
            console.log('Processing feed scores for anonymous user');
        }

        let requestData;
        try {
            requestData = await req.json();
        } catch (parseError) {
            console.error('Failed to parse request JSON:', parseError);
            return Response.json({
                success: false,
                error: 'Invalid JSON payload'
            }, { status: 400 });
        }

        const { 
            posts = [],
            activeTab = 'for_you',
            filters = {}
        } = requestData;

        console.log('📊 Feed scoring request:', { 
            postsCount: posts.length, 
            activeTab, 
            hasCurrentUser: !!currentUser,
            filters: Object.keys(filters).length
        });

        // Validate input
        if (!Array.isArray(posts)) {
            return Response.json({
                success: false,
                error: 'Posts must be an array'
            }, { status: 400 });
        }

        if (posts.length === 0) {
            return Response.json({
                success: true,
                posts: [],
                algorithm_used: 'none',
                posts_scored: 0,
                processing_time: Date.now() - startTime
            });
        }

        // Check cache first
        const cacheKey = getCacheKey(posts, activeTab, currentUser?.id);
        const cachedResult = getFromCache(cacheKey);
        if (cachedResult) {
            console.log('🎯 Returning cached feed scores');
            return Response.json(cachedResult);
        }

        // Limit processing to reasonable batch size
        const maxPosts = Math.min(posts.length, 100);
        const postsToProcess = posts.slice(0, maxPosts);

        let scoredPosts = [];
        let algorithmUsed = 'chronological';

        try {
            switch (activeTab) {
                case 'for_you':
                case 'ai_personalized': {
                    algorithmUsed = 'ai_personalized';
                    scoredPosts = postsToProcess.map(post => ({
                        ...post,
                        ai_score: calculateAIScore(post, currentUser),
                        algorithm_used: algorithmUsed
                    })).sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0));
                    break;
                }

                case 'trending':
                case 'viral': {
                    algorithmUsed = 'viral_trending';
                    scoredPosts = postsToProcess.map(post => ({
                        ...post,
                        viral_score: calculateViralScore(post, 24),
                        algorithm_used: algorithmUsed
                    })).sort((a, b) => (b.viral_score || 0) - (a.viral_score || 0));
                    break;
                }

                case 'videos':
                case 'clips': {
                    algorithmUsed = 'video_trending';
                    // Filter to only video posts first
                    const videoPosts = postsToProcess.filter(post => {
                        return post.media_urls && Array.isArray(post.media_urls) && 
                               post.media_urls.some(url => /\.(mp4|webm|mov|avi|m4v)$/i.test(url));
                    });

                    scoredPosts = videoPosts.map(post => ({
                        ...post,
                        video_trending_score: calculateVideoTrendingScore(post),
                        algorithm_used: algorithmUsed
                    })).sort((a, b) => (b.video_trending_score || 0) - (a.video_trending_score || 0));
                    break;
                }

                default: {
                    // Chronological order
                    algorithmUsed = 'chronological';
                    scoredPosts = postsToProcess.sort((a, b) => 
                        new Date(b.created_date || 0).getTime() - new Date(a.created_date || 0).getTime()
                    );
                    break;
                }
            }

            const processingTime = Date.now() - startTime;
            const result = {
                success: true,
                posts: scoredPosts,
                algorithm_used: algorithmUsed,
                posts_scored: scoredPosts.length,
                processing_time: processingTime,
                personalization_score: currentUser ? 0.8 : 0.1,
                quality_boost: scoredPosts.length > 0 ? 1.2 : 1.0
            };

            // Cache the result
            setCache(cacheKey, result);

            console.log('✅ Feed scoring completed:', {
                algorithm: algorithmUsed,
                processed: scoredPosts.length,
                time: processingTime + 'ms'
            });

            return Response.json(result);

        } catch (algorithmError) {
            console.error('Error in scoring algorithm:', algorithmError);
            
            // Fallback to simple chronological
            const fallbackPosts = postsToProcess.sort((a, b) => 
                new Date(b.created_date || 0).getTime() - new Date(a.created_date || 0).getTime()
            );

            return Response.json({
                success: true,
                posts: fallbackPosts,
                algorithm_used: 'chronological_fallback',
                posts_scored: fallbackPosts.length,
                processing_time: Date.now() - startTime,
                error: 'Algorithm failed, using fallback'
            });
        }

    } catch (error) {
        console.error('❌ Feed scoring error:', error);
        
        return Response.json({
            success: false,
            error: 'Internal scoring error',
            processing_time: Date.now() - startTime
        }, { status: 500 });
    }
});