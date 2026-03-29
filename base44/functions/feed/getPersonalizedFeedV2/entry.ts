import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { limit = 30, offset = 0 } = await req.json();

    // Fetch user's activity to build interest profile
    const [allPosts, userActivity, followData, userPosts] = await Promise.all([
      base44.asServiceRole.entities.Post.list('-created_date', 500),
      base44.asServiceRole.entities.UserActivity.filter(
        { user_email: user.email },
        '-created_date',
        100
      ),
      base44.asServiceRole.entities.Follow.filter(
        { follower_email: user.email, status: 'active' }
      ),
      base44.asServiceRole.entities.Post.filter(
        { created_by: user.email },
        '-created_date',
        50
      )
    ]);

    // Build user interest profile
    const interestProfile = buildInterestProfile(userActivity, userPosts);
    const followedUserIds = new Set(followData.map(f => f.followee_id));

    // Score and rank posts
    const scoredPosts = allPosts
      .filter(post => !post.isDeleted && post.status === 'published')
      .filter(post => post.created_by !== user.email) // Don't show own posts
      .map(post => ({
        ...post,
        score: calculatePostScore(post, user, interestProfile, followedUserIds)
      }))
      .sort((a, b) => b.score - a.score);

    // Apply diversity filter
    const diversePosts = applyDiversityFilter(scoredPosts, interestProfile);

    // Paginate
    const paginatedPosts = diversePosts.slice(offset, offset + limit);

    return Response.json({
      posts: paginatedPosts,
      hasMore: diversePosts.length > offset + limit,
      totalCount: diversePosts.length
    });
  } catch (error) {
    console.error('Personalized feed error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function buildInterestProfile(activities, userPosts) {
  const profile = {
    tags: {},
    categories: {},
    postTypes: {},
    authors: {},
    recency: 0
  };

  // Analyze user activity
  activities.forEach(activity => {
    const weight = getActivityWeight(activity.action_type);
    
    if (activity.metadata?.tags) {
      activity.metadata.tags.forEach(tag => {
        profile.tags[tag] = (profile.tags[tag] || 0) + weight;
      });
    }
    
    if (activity.metadata?.category) {
      profile.categories[activity.metadata.category] = 
        (profile.categories[activity.metadata.category] || 0) + weight;
    }
    
    if (activity.metadata?.post_type) {
      profile.postTypes[activity.metadata.post_type] = 
        (profile.postTypes[activity.metadata.post_type] || 0) + weight;
    }

    if (activity.metadata?.author_email) {
      profile.authors[activity.metadata.author_email] = 
        (profile.authors[activity.metadata.author_email] || 0) + weight;
    }
  });

  // Analyze user's own posts for content preferences
  userPosts.forEach(post => {
    if (post.tags) {
      post.tags.forEach(tag => {
        profile.tags[tag] = (profile.tags[tag] || 0) + 0.5;
      });
    }
    if (post.category) {
      profile.categories[post.category] = (profile.categories[post.category] || 0) + 0.5;
    }
  });

  // Calculate recency preference (how fresh content user prefers)
  const recentActivities = activities.slice(0, 20);
  const avgAge = recentActivities.reduce((sum, act) => {
    const ageHours = (Date.now() - new Date(act.created_date).getTime()) / (1000 * 60 * 60);
    return sum + ageHours;
  }, 0) / (recentActivities.length || 1);
  profile.recency = Math.max(0, 1 - (avgAge / 168)); // Normalize to 0-1 (168h = 1 week)

  return profile;
}

function getActivityWeight(actionType) {
  const weights = {
    'like': 1,
    'comment': 3,
    'repost': 2,
    'bookmark': 4,
    'follow': 2,
    'view': 0.1,
    'story_view': 0.5
  };
  return weights[actionType] || 0.5;
}

function calculatePostScore(post, user, interestProfile, followedUserIds) {
  let score = 0;

  // 1. Engagement Score (40% weight)
  const engagementScore = calculateEngagementScore(post);
  score += engagementScore * 0.4;

  // 2. Relevance Score (30% weight)
  const relevanceScore = calculateRelevanceScore(post, interestProfile);
  score += relevanceScore * 0.3;

  // 3. Social Score (15% weight)
  const socialScore = followedUserIds.has(post.created_by) ? 100 : 0;
  score += socialScore * 0.15;

  // 4. Recency Score (10% weight)
  const recencyScore = calculateRecencyScore(post, interestProfile.recency);
  score += recencyScore * 0.1;

  // 5. Quality Score (5% weight)
  const qualityScore = calculateQualityScore(post);
  score += qualityScore * 0.05;

  return score;
}

function calculateEngagementScore(post) {
  const totalReactions = Object.values(post.reactions || {})
    .reduce((sum, r) => sum + (r.count || 0), 0);
  const comments = post.comments_count || 0;
  const views = post.view_count || 1;
  const shares = post.share_count || 0;

  // Calculate engagement rate
  const engagementRate = ((totalReactions * 1.5) + (comments * 3) + (shares * 4)) / views;
  
  // Normalize to 0-100 scale
  return Math.min(100, engagementRate * 1000);
}

function calculateRelevanceScore(post, interestProfile) {
  let score = 0;
  let matchCount = 0;

  // Tag matching (highest weight)
  if (post.tags && post.tags.length > 0) {
    post.tags.forEach(tag => {
      if (interestProfile.tags[tag]) {
        score += interestProfile.tags[tag] * 10;
        matchCount++;
      }
    });
  }

  // Category matching
  if (post.category && interestProfile.categories[post.category]) {
    score += interestProfile.categories[post.category] * 8;
    matchCount++;
  }

  // Post type matching
  if (post.type && interestProfile.postTypes[post.type]) {
    score += interestProfile.postTypes[post.type] * 5;
    matchCount++;
  }

  // Author matching
  if (post.created_by && interestProfile.authors[post.created_by]) {
    score += interestProfile.authors[post.created_by] * 7;
    matchCount++;
  }

  // Normalize by number of matches (avoid unfairly penalizing posts with fewer tags)
  return matchCount > 0 ? Math.min(100, (score / matchCount) * 10) : 20;
}

function calculateRecencyScore(post, recencyPreference) {
  const ageHours = (Date.now() - new Date(post.created_date).getTime()) / (1000 * 60 * 60);
  
  // Decay function based on age
  const decay = Math.exp(-ageHours / 48); // 48-hour half-life
  
  // Blend with user's recency preference
  const baseScore = decay * 100;
  const preferenceAdjusted = baseScore * (0.5 + (recencyPreference * 0.5));
  
  return preferenceAdjusted;
}

function calculateQualityScore(post) {
  let score = 50; // Base score

  // Has media
  if (post.media_urls && post.media_urls.length > 0) {
    score += 15;
  }

  // Has meaningful content
  const contentLength = (post.content || '').length;
  if (contentLength > 100) score += 10;
  if (contentLength > 300) score += 10;

  // Has tags
  if (post.tags && post.tags.length > 0) {
    score += 10;
  }

  // Not moderation flagged
  if (post.moderation_status === 'allow') {
    score += 5;
  }

  return Math.min(100, score);
}

function applyDiversityFilter(posts, interestProfile) {
  const diversePosts = [];
  const seenAuthors = new Map();
  const seenCategories = new Map();
  const seenTags = new Set();
  const batchSize = 10;

  // Process posts in batches to maintain diversity
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    
    // Check diversity constraints
    const authorCount = seenAuthors.get(post.created_by) || 0;
    const categoryCount = seenCategories.get(post.category) || 0;
    
    // Allow if:
    // 1. From new author/category within batch
    // 2. High enough score to override diversity
    const shouldInclude = 
      authorCount < 2 && 
      categoryCount < 3 &&
      (diversePosts.length % batchSize !== 0 || post.score > 70);

    if (shouldInclude) {
      diversePosts.push(post);
      seenAuthors.set(post.created_by, authorCount + 1);
      seenCategories.set(post.category, categoryCount + 1);
      
      // Track tags
      if (post.tags) {
        post.tags.forEach(tag => seenTags.add(tag));
      }

      // Reset counters every batch for fresh diversity
      if (diversePosts.length % batchSize === 0) {
        seenAuthors.clear();
        seenCategories.clear();
      }
    }
  }

  return diversePosts;
}