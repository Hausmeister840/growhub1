/**
 * 🚀 FEED SERVICE - Intelligente Content-Curation
 */

import { base44 } from '@/api/base44Client';

/**
 * Berechnet Engagement-Score für einen Post
 */
export const calculateEngagementScore = (post, timeDecay = true) => {
  const now = Date.now();
  const postAge = now - new Date(post.created_date).getTime();
  const hoursOld = postAge / (1000 * 60 * 60);

  // Basis-Metriken
  const likes = Object.values(post.reactions || {}).reduce((sum, r) => sum + (r.count || 0), 0);
  const comments = post.comments_count || 0;
  const shares = post.share_count || 0;
  const views = post.view_count || 0;

  // Gewichtung
  const score = 
    (likes * 1) +
    (comments * 3) +
    (shares * 5) +
    (views * 0.01);

  // Time Decay
  if (timeDecay && hoursOld > 0) {
    const decayFactor = Math.pow(hoursOld + 2, -1.5);
    return score * decayFactor;
  }

  return score;
};

/**
 * Score für personalisierten Feed
 */
const calculatePersonalizedScore = (post, followedEmails, interests, userEmail) => {
  let score = 0;
  
  // Bonus für Posts von gefolgten Usern
  if (followedEmails.includes(post.created_by)) {
    score += 10;
  }
  
  // Engagement Score
  score += calculateEngagementScore(post, true);
  
  // Tag-Match mit Interessen
  const postTags = post.tags || [];
  const matchingTags = postTags.filter(tag => interests.includes(tag));
  score += matchingTags.length * 2;
  
  return score;
};

/**
 * Lädt Posts für personalisierten Feed
 */
export async function getPersonalizedFeed(userId, userEmail, limit = 20, offset = 0) {
  try {
    const [allPosts, allUsers, follows] = await Promise.all([
      base44.entities.Post.filter({ status: 'published' }, '-created_date', limit * 2, offset),
      base44.entities.User.list('-created_date', 100),
      base44.entities.Follow.filter({ follower_id: userId })
    ]);

    const user = allUsers.find(u => u.id === userId || u.email === userEmail);
    const followedEmails = follows.map(f => f.followee_email);
    const interests = user?.interests || [];
    const seenPostIds = user?.seen_posts || [];

    // Score posts
    const scoredPosts = allPosts
      .filter(post => !seenPostIds.includes(post.id))
      .map(post => ({
        ...post,
        score: calculatePersonalizedScore(post, followedEmails, interests, userEmail)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scoredPosts;
  } catch (error) {
    console.error('Personalized feed error:', error);
    return base44.entities.Post.filter({ status: 'published' }, '-created_date', limit, offset);
  }
}

/**
 * Lädt Trending Posts
 */
export async function getTrendingFeed(limit = 30, timeWindow = 48) {
  try {
    const cutoffDate = new Date(Date.now() - timeWindow * 60 * 60 * 1000).toISOString();
    
    const recentPosts = await base44.entities.Post.filter(
      { status: 'published' },
      '-created_date',
      limit * 3
    );

    // Filter nach Zeitfenster und ranken
    const trending = recentPosts
      .filter(post => new Date(post.created_date) >= new Date(cutoffDate))
      .map(post => ({
        ...post,
        _engagementScore: calculateEngagementScore(post, false)
      }))
      .sort((a, b) => b._engagementScore - a._engagementScore)
      .slice(0, limit);

    return trending;
  } catch (error) {
    console.error('Trending feed error:', error);
    return [];
  }
}

/**
 * Lädt Video-Posts
 */
export async function getVideoFeed(limit = 30) {
  try {
    const allPosts = await base44.entities.Post.filter(
      { status: 'published' },
      '-created_date',
      limit * 2
    );

    const videoPosts = allPosts.filter(post => {
      if (!post.media_urls || !Array.isArray(post.media_urls)) return false;
      return post.media_urls.some(url => {
        const videoExts = ['.mp4', '.webm', '.ogg', '.mov'];
        return videoExts.some(ext => url.toLowerCase().includes(ext));
      });
    });

    return videoPosts.slice(0, limit);
  } catch (error) {
    console.error('Video feed error:', error);
    return [];
  }
}

/**
 * Berechnet Similarity zwischen zwei Vektoren
 */
export const calculateSimilarity = (vectorA, vectorB) => {
  if (!vectorA || !vectorB || vectorA.length !== vectorB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Diversifiziert Feed
 */
export const diversifyFeed = (posts, diversityRatio = 0.15) => {
  const mainFeed = posts.slice(0, Math.floor(posts.length * (1 - diversityRatio)));
  const diversePosts = posts.slice(Math.floor(posts.length * (1 - diversityRatio)));
  
  // Shuffle diverse posts
  for (let i = diversePosts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [diversePosts[i], diversePosts[j]] = [diversePosts[j], diversePosts[i]];
  }

  return [...mainFeed, ...diversePosts];
};

export default {
  getPersonalizedFeed,
  getTrendingFeed,
  getVideoFeed,
  calculateEngagementScore,
  calculateSimilarity,
  diversifyFeed
};