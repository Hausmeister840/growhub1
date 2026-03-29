// Tracks user attention and rewards engagement
class AttentionEconomyTracker {
  constructor() {
    this.viewTimes = new Map();
    this.interactionScores = new Map();
    this.earnedTokens = 0;
  }

  // Track view duration
  startTracking(postId) {
    this.viewTimes.set(postId, {
      startTime: Date.now(),
      interactions: 0
    });
  }

  endTracking(postId) {
    const tracked = this.viewTimes.get(postId);
    if (!tracked) return 0;

    const duration = Date.now() - tracked.startTime;
    const score = this.calculateAttentionScore(duration, tracked.interactions);
    
    this.interactionScores.set(postId, score);
    this.viewTimes.delete(postId);

    return score;
  }

  recordInteraction(postId, type) {
    const tracked = this.viewTimes.get(postId);
    if (!tracked) return;

    tracked.interactions++;

    const points = {
      'view': 1,
      'like': 5,
      'comment': 10,
      'share': 15,
      'bookmark': 8
    };

    const earned = points[type] || 0;
    this.earnedTokens += earned;

    return earned;
  }

  calculateAttentionScore(duration, interactions) {
    // Score based on view duration (ms)
    const durationScore = Math.min(duration / 1000, 30);
    const interactionScore = interactions * 5;
    
    return Math.round(durationScore + interactionScore);
  }

  getEarnedTokens() {
    return this.earnedTokens;
  }

  getTotalScore() {
    let total = 0;
    this.interactionScores.forEach(score => total += score);
    return total;
  }

  getStats() {
    return {
      totalTokens: this.earnedTokens,
      totalScore: this.getTotalScore(),
      postsViewed: this.interactionScores.size,
      avgScore: this.getTotalScore() / Math.max(this.interactionScores.size, 1)
    };
  }

  reset() {
    this.viewTimes.clear();
    this.interactionScores.clear();
    this.earnedTokens = 0;
  }
}

export const attentionTracker = new AttentionEconomyTracker();