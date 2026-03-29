
class NeuralFeedOptimizer {
  constructor() {
    this.weights = {
      engagement: 0.3,
      recency: 0.25,
      relevance: 0.25,
      diversity: 0.15,
      quality: 0.05
    };
    this.learningRate = 0.01;
    this.userProfile = {
      interests: {},
      following: [],
      preferredTypes: {},
      preferredAuthors: new Set(),
      recentPosts: []
    };
  }

  // Calculate multi-dimensional score
  calculateScore(post, userContext) {
    const scores = {
      engagement: this.scoreEngagement(post),
      recency: this.scoreRecency(post),
      relevance: this.scoreRelevance(post, userContext),
      diversity: this.scoreDiversity(post, userContext.recentPosts),
      quality: this.scoreQuality(post)
    };

    // Weighted sum
    let finalScore = 0;
    Object.keys(this.weights).forEach(key => {
      finalScore += scores[key] * this.weights[key];
    });

    return finalScore;
  }

  scoreEngagement(post) {
    const likes = post.reactions?.like?.count || 0;
    const comments = post.comments_count || 0;
    const shares = post.share_count || 0;
    const views = Math.max(post.view_count || 1, 1);

    // Engagement rate with diminishing returns
    const rawScore = (likes * 1.5 + comments * 3 + shares * 4) / views;
    return Math.log1p(rawScore) * 10; // Log scale to prevent outliers
  }

  scoreRecency(post) {
    const ageHours = (Date.now() - new Date(post.created_date).getTime()) / (1000 * 60 * 60);
    
    // Sigmoid decay: fresh content gets boost, but doesn't kill old content
    return 100 / (1 + Math.exp((ageHours - 24) / 12));
  }

  scoreRelevance(post, userContext) {
    let score = 0;

    // Tag matching
    if (post.tags && userContext.interests) {
      post.tags.forEach(tag => {
        score += (userContext.interests[tag] || 0) * 10;
      });
    }

    // Author preference
    if (userContext.following?.includes(post.created_by)) {
      score += 30;
    }

    // Content type preference
    if (userContext.preferredTypes?.[post.type]) {
      score += 15;
    }

    return Math.min(score, 100);
  }

  scoreDiversity(post, recentPosts = []) {
    // Penalize if user has seen too many posts from same author
    const authorCount = recentPosts.filter(p => p.created_by === post.created_by).length;
    const authorPenalty = Math.min(authorCount * 10, 50);

    // Penalize if user has seen too many posts with same tags
    let tagOverlap = 0;
    recentPosts.forEach(recent => {
      if (recent.tags && post.tags) {
        const overlap = recent.tags.filter(t => post.tags.includes(t)).length;
        tagOverlap += overlap;
      }
    });
    const tagPenalty = Math.min(tagOverlap * 5, 30);

    return Math.max(100 - authorPenalty - tagPenalty, 0);
  }

  scoreQuality(post) {
    let score = 50; // Base score

    // Has media
    if (post.media_urls?.length > 0) score += 15;

    // Has meaningful content
    if (post.content?.length > 100) score += 10;

    // Has tags
    if (post.tags?.length > 0) score += 10;

    // Author is verified
    if (post.author_verified) score += 15;

    return Math.min(score, 100);
  }

  // Adaptive learning - adjust weights based on user feedback
  async learn(userFeedback) {
    // userFeedback: { action: 'skip' | 'engage', post, duration }
    
    if (userFeedback.action === 'skip' && userFeedback.duration < 2000) {
      // User skipped quickly - adjust weights
      const post = userFeedback.post;
      
      // Decrease relevance weight if they skipped relevant content
      if (post.relevanceScore > 70) {
        this.weights.relevance -= this.learningRate;
        this.weights.engagement += this.learningRate;
      }
    } else if (userFeedback.action === 'engage') {
      // User engaged - reinforce weights
      const post = userFeedback.post;
      
      if (post.recencyScore > 70) {
        this.weights.recency += this.learningRate * 0.5;
      }
      if (post.relevanceScore > 70) {
        this.weights.relevance += this.learningRate * 0.5;
      }
    }

    // Normalize weights to sum to 1
    const sum = Object.values(this.weights).reduce((a, b) => a + b, 0);
    Object.keys(this.weights).forEach(key => {
      this.weights[key] /= sum;
    });
  }

  // Get optimized feed order
  async optimizeFeed(posts, userContext) {
    const scored = posts.map(post => ({
      ...post,
      neuralScore: this.calculateScore(post, userContext)
    }));

    // Apply diversity filter
    const diverse = this.applyDiversityFilter(scored);

    return diverse.sort((a, b) => b.neuralScore - a.neuralScore);
  }

  applyDiversityFilter(posts) {
    const result = [];
    const authorCount = {};
    const tagCount = {};

    posts.forEach(post => {
      const author = post.created_by;
      const tags = post.tags || [];

      // Max 2 posts per author in first 20
      if (result.length < 20 && (authorCount[author] || 0) >= 2) {
        post.neuralScore *= 0.5; // Penalty
      }

      // Max 3 posts per tag in first 20
      tags.forEach(tag => {
        if (result.length < 20 && (tagCount[tag] || 0) >= 3) {
          post.neuralScore *= 0.7; // Penalty
        }
      });

      result.push(post);
      authorCount[author] = (authorCount[author] || 0) + 1;
      tags.forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });

    return result;
  }

  // Export profile for debugging
  getProfile() {
    return {
      interests: this.userProfile.interests,
      following: this.userProfile.following,
      preferredTypes: this.userProfile.preferredTypes,
      weights: this.weights,
      preferredAuthors: Array.from(this.userProfile.preferredAuthors || [])
    };
  }

  // Update user profile
  updateProfile(userContext) {
    if (userContext) {
      this.userProfile = {
        ...this.userProfile,
        ...userContext
      };
    }
  }
}

export const neuralOptimizer = new NeuralFeedOptimizer();