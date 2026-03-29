import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * 🎯 SMART RECOMMENDATION ENGINE
 * Personalisierte Content-Empfehlungen basierend auf:
 * - User Embeddings
 * - Content Embeddings
 * - Engagement History
 * - Social Graph
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type = 'posts', limit = 20 } = await req.json().catch(() => ({}));

    let recommendations = [];

    switch (type) {
      case 'posts':
        recommendations = await recommendPosts(base44, user, limit);
        break;
      
      case 'users':
        recommendations = await recommendUsers(base44, user, limit);
        break;
      
      case 'articles':
        recommendations = await recommendArticles(base44, user, limit);
        break;
      
      default:
        return Response.json({ error: 'Invalid type' }, { status: 400 });
    }

    return Response.json({
      success: true,
      recommendations,
      count: recommendations.length
    });

  } catch (error) {
    console.error('Recommendation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Empfehle Posts basierend auf User Interessen
 */
async function recommendPosts(base44, user, limit) {
  // 1. Hole User Embedding
  const userEmbeddings = await base44.entities.UserEmbedding.filter({
    user_email: user.email
  });

  let userTopics = [];
  if (userEmbeddings.length > 0) {
    userTopics = userEmbeddings[0].topics_preference || [];
  }

  // 2. Hole Posts der letzten 7 Tage
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentPosts = await base44.entities.Post.filter({
    visibility: 'public',
    created_date: { '$gte': sevenDaysAgo.toISOString() }
  }, '-created_date', 200);

  // 3. Filtere bereits gesehene Posts
  const seenPostIds = await getSeenPosts(base44, user.email);
  const unseenPosts = recentPosts.filter(p => !seenPostIds.has(p.id));

  // 4. Score Posts
  const scoredPosts = unseenPosts.map(post => {
    let score = 0;

    // Topic Match
    const postTags = post.tags || [];
    const topicMatches = postTags.filter(tag => userTopics.includes(tag)).length;
    score += topicMatches * 10;

    // Engagement Score
    const totalReactions = Object.values(post.reactions || {})
      .reduce((sum, r) => sum + (r.count || 0), 0);
    score += totalReactions * 0.5;
    score += (post.comments_count || 0) * 1;
    score += (post.share_count || 0) * 2;

    // Freshness (neuere Posts bevorzugen)
    const hoursOld = (Date.now() - new Date(post.created_date).getTime()) / (1000 * 60 * 60);
    const freshnessScore = Math.max(0, 10 - hoursOld / 24);
    score += freshnessScore;

    // Quality Score (falls vorhanden)
    if (post.quality_score) {
      score += post.quality_score * 20;
    }

    return { post, score };
  });

  // 5. Sortiere und limitiere
  scoredPosts.sort((a, b) => b.score - a.score);
  const topPosts = scoredPosts.slice(0, limit).map(({ post, score }) => ({
    ...post,
    recommendation_score: score
  }));

  // 6. Speichere Empfehlungen
  for (const post of topPosts) {
    try {
      await base44.entities.UserRecommendation.create({
        user_email: user.email,
        recommended_item_type: 'post',
        recommended_item_id: post.id,
        confidence_score: Math.min(1, post.recommendation_score / 100),
        reasoning: `Match: ${post.recommendation_score.toFixed(1)} points`
      });
    } catch {
      // Ignore duplicates
    }
  }

  return topPosts;
}

/**
 * Empfehle User zum Folgen
 */
async function recommendUsers(base44, user, limit) {
  // Hole Following-Liste
  const currentUserData = await base44.entities.User.get(user.id);
  const following = currentUserData.following || [];

  // Finde aktive Creator
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentPosts = await base44.entities.Post.filter({
    created_date: { '$gte': sevenDaysAgo.toISOString() }
  });

  // Zähle Posts pro Creator
  const creatorStats = {};
  for (const post of recentPosts) {
    const creator = post.created_by;
    if (creator === user.email || following.includes(creator)) continue;

    if (!creatorStats[creator]) {
      creatorStats[creator] = {
        email: creator,
        posts: 0,
        totalEngagement: 0
      };
    }

    creatorStats[creator].posts++;
    const engagement = Object.values(post.reactions || {})
      .reduce((sum, r) => sum + (r.count || 0), 0) + 
      (post.comments_count || 0);
    creatorStats[creator].totalEngagement += engagement;
  }

  // Score und sortiere
  const scoredCreators = Object.values(creatorStats)
    .map(stats => ({
      ...stats,
      score: stats.posts * 5 + stats.totalEngagement
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // Hole User-Daten
  const userEmails = scoredCreators.map(c => c.email);
  const users = await base44.entities.User.filter({
    email: { '$in': userEmails }
  });

  return users.map(u => {
    const stats = scoredCreators.find(c => c.email === u.email);
    return {
      ...u,
      recommendation_score: stats?.score || 0,
      reason: `${stats?.posts || 0} Posts, ${stats?.totalEngagement || 0} Engagement`
    };
  });
}

/**
 * Empfehle Knowledge Articles
 */
async function recommendArticles(base44, user, limit) {
  // Hole User Interessen
  const userEmbeddings = await base44.entities.UserEmbedding.filter({
    user_email: user.email
  });

  const userTopics = userEmbeddings.length > 0 
    ? userEmbeddings[0].topics_preference || []
    : [];

  // Hole Articles
  const articles = await base44.entities.KnowledgeArticle.list('-created_date', 100);

  // Score Articles
  const scoredArticles = articles.map(article => {
    let score = 0;

    // Topic Match
    const tagMatches = (article.tags || []).filter(tag => 
      userTopics.includes(tag)
    ).length;
    score += tagMatches * 10;

    // Quality Indicators
    score += (article.upvotes || 0) * 0.5;
    score += article.expert_verified ? 20 : 0;
    score += article.featured ? 15 : 0;

    // Popularity
    score += (article.views_count || 0) * 0.01;

    return { article, score };
  });

  scoredArticles.sort((a, b) => b.score - a.score);
  return scoredArticles.slice(0, limit).map(({ article }) => article);
}

/**
 * Helper: Get seen posts for user
 */
async function getSeenPosts(base44, userEmail) {
  const activities = await base44.entities.UserActivity.filter({
    user_email: userEmail,
    event_type: { '$in': ['impression', 'like', 'comment'] }
  }, '-created_date', 500);

  return new Set(activities.map(a => a.post_id).filter(Boolean));
}