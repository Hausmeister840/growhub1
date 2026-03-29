import { base44 } from '@/api/base44Client';

class ContentRecommendationEngine {
  constructor() {
    this.userProfile = {
      interests: {},
      preferredAuthors: new Set(),
      engagementPatterns: {},
      activeHours: {},
      contentTypes: {}
    };
  }

  // Learn from user behavior
  async learn(interactions) {
    interactions.forEach(interaction => {
      // Track interests from tags
      if (interaction.post?.tags) {
        interaction.post.tags.forEach(tag => {
          this.userProfile.interests[tag] = (this.userProfile.interests[tag] || 0) + 1;
        });
      }

      // Track preferred authors
      if (interaction.type === 'like' || interaction.type === 'comment') {
        this.userProfile.preferredAuthors.add(interaction.post.created_by);
      }

      // Track content types
      const contentType = interaction.post.type || 'text';
      this.userProfile.contentTypes[contentType] = (this.userProfile.contentTypes[contentType] || 0) + 1;

      // Track active hours
      const hour = new Date(interaction.timestamp).getHours();
      this.userProfile.activeHours[hour] = (this.userProfile.activeHours[hour] || 0) + 1;
    });
  }

  // Score a post based on user profile
  scorePost(post, currentHour) {
    let score = 0;

    // Interest matching (40%)
    if (post.tags) {
      post.tags.forEach(tag => {
        const interest = this.userProfile.interests[tag] || 0;
        score += interest * 0.4;
      });
    }

    // Preferred author (20%)
    if (this.userProfile.preferredAuthors.has(post.created_by)) {
      score += 20;
    }

    // Content type preference (15%)
    const typePreference = this.userProfile.contentTypes[post.type] || 0;
    score += typePreference * 0.15;

    // Time-based relevance (10%)
    const hourPreference = this.userProfile.activeHours[currentHour] || 0;
    score += hourPreference * 0.1;

    // Engagement score (15%)
    score += (post.engagement_score || 0) * 0.15;

    return score;
  }

  // Get recommended posts
  async getRecommendations(allPosts, limit = 20) {
    const currentHour = new Date().getHours();
    
    const scored = allPosts.map(post => ({
      ...post,
      recommendation_score: this.scorePost(post, currentHour)
    }));

    return scored
      .sort((a, b) => b.recommendation_score - a.recommendation_score)
      .slice(0, limit);
  }

  // Predict next content user might like
  async predictNext(recentViews) {
    const patterns = this.analyzePatterns(recentViews);
    
    // Use AI for advanced prediction
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on these recent content interactions, predict what content the user wants next:
        
Recent views: ${JSON.stringify(patterns)}
User interests: ${JSON.stringify(this.userProfile.interests)}

Predict next 3 content types and topics they'd enjoy.`,
        response_json_schema: {
          type: "object",
          properties: {
            predicted_topics: { type: "array", items: { type: "string" } },
            predicted_content_types: { type: "array", items: { type: "string" } },
            confidence: { type: "number" }
          }
        }
      });

      return response;
    } catch (error) {
      console.error('Prediction failed:', error);
      return null;
    }
  }

  analyzePatterns(recentViews) {
    const patterns = {
      avg_view_duration: 0,
      most_viewed_category: null,
      engagement_rate: 0
    };

    if (recentViews.length === 0) return patterns;

    // Calculate averages
    const totalDuration = recentViews.reduce((sum, view) => sum + (view.duration || 0), 0);
    patterns.avg_view_duration = totalDuration / recentViews.length;

    // Find most viewed category
    const categories = {};
    recentViews.forEach(view => {
      categories[view.category] = (categories[view.category] || 0) + 1;
    });
    patterns.most_viewed_category = Object.entries(categories)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    return patterns;
  }
}

export const recommendationEngine = new ContentRecommendationEngine();