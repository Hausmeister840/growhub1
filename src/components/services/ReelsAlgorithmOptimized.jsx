/**
 * Optimierte Version des Reels-Algorithmus
 * - Async operations
 * - Debounced saves
 * - Memoized calculations
 * - Web Worker ready
 */

import { debounce } from 'lodash';

export class ReelsAlgorithmOptimized {
  constructor() {
    this.userProfile = this.loadUserProfile();
    this.sessionData = {
      watched: new Set(),
      liked: new Set(),
      skipped: new Set(),
      replayed: new Set(),
      watchTimes: new Map(),
      interactions: []
    };
    
    // Debounce saves to prevent blocking
    this.debouncedSave = debounce(() => this.saveUserProfile(), 2000, {
      leading: false,
      trailing: true
    });
    
    // Cache for score calculations
    this.scoreCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  loadUserProfile() {
    try {
      const saved = localStorage.getItem('reels_user_profile');
      return saved ? JSON.parse(saved) : this.getDefaultProfile();
    } catch {
      return this.getDefaultProfile();
    }
  }

  getDefaultProfile() {
    return {
      preferences: {
        creators: {},
        hashtags: {},
        categories: {}
      },
      engagement: {
        totalVideos: 0,
        totalLikes: 0,
        totalComments: 0,
        avgCompletionRate: 0
      },
      lastUpdated: Date.now()
    };
  }

  saveUserProfile() {
    // Use requestIdleCallback for non-blocking save
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => this._doSave(), { timeout: 2000 });
    } else {
      setTimeout(() => this._doSave(), 0);
    }
  }

  _doSave() {
    try {
      this.userProfile.lastUpdated = Date.now();
      localStorage.setItem('reels_user_profile', JSON.stringify(this.userProfile));
    } catch (e) {
      console.error('Failed to save profile:', e);
    }
  }

  /**
   * Async ranking - Non-blocking
   */
  async rankVideos(videos, currentUser, followingEmails = []) {
    if (!videos || videos.length === 0) return [];

    // Clear old cache
    this.clearExpiredCache();

    // Use requestIdleCallback for heavy computation
    return new Promise((resolve) => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback((deadline) => {
          const ranked = this._computeRanking(videos, currentUser, followingEmails, deadline);
          resolve(ranked);
        }, { timeout: 1000 });
      } else {
        setTimeout(() => {
          const ranked = this._computeRanking(videos, currentUser, followingEmails);
          resolve(ranked);
        }, 0);
      }
    });
  }

  _computeRanking(videos, currentUser, followingEmails, deadline = null) {
    const rankedVideos = videos.map((video, index) => {
      // Check if we have time left (for requestIdleCallback)
      if (deadline && deadline.timeRemaining() < 1) {
        // Return early with basic score if running out of time
        return {
          video,
          score: this.getBasicScore(video, followingEmails)
        };
      }

      return {
        video,
        score: this.calculateVideoScore(video, currentUser, followingEmails)
      };
    });

    // Sort with controlled randomness
    rankedVideos.sort((a, b) => {
      const scoreDiff = b.score - a.score;
      const randomFactor = (Math.random() - 0.5) * 0.15;
      return scoreDiff * (1 + randomFactor);
    });

    return this.diversifyFeed(rankedVideos.map(r => r.video));
  }

  getBasicScore(video, followingEmails) {
    let score = 0;
    
    // Simple engagement
    const likes = video.reactions?.like?.count || 0;
    const comments = video.comments_count || 0;
    score += (likes * 2 + comments * 3);
    
    // Following boost
    if (followingEmails.includes(video.created_by)) {
      score += 200;
    }
    
    return score;
  }

  calculateVideoScore(video, currentUser, followingEmails) {
    // Check cache first
    const cacheKey = `${video.id}-${Date.now() - (Date.now() % this.cacheExpiry)}`;
    if (this.scoreCache.has(cacheKey)) {
      return this.scoreCache.get(cacheKey);
    }

    let score = 0;

    // 1. Engagement (40%)
    const likes = video.reactions?.like?.count || 0;
    const comments = video.comments_count || 0;
    const views = video.view_count || 1;
    const engagementRate = (likes + comments * 2) / views;
    score += Math.min(engagementRate * 400, 400); // Cap at 400

    // 2. Creator Affinity (30%)
    if (followingEmails.includes(video.created_by)) {
      score += 300;
    }
    const creatorScore = this.userProfile.preferences?.creators?.[video.created_by] || 0;
    score += creatorScore * 0.3;

    // 3. Content Preferences (20%)
    if (video.tags && Array.isArray(video.tags)) {
      const tagScores = video.tags.reduce((sum, tag) => {
        return sum + (this.userProfile.preferences?.hashtags?.[tag] || 0);
      }, 0);
      score += Math.min(tagScores * 4, 200); // Cap at 200
    }

    // 4. Freshness (10%)
    const ageInHours = (Date.now() - new Date(video.created_date).getTime()) / (1000 * 60 * 60);
    const freshnessScore = Math.max(0, 100 - ageInHours / 2);
    score += freshnessScore;

    // 5. Session penalties
    if (this.sessionData.watched.has(video.id)) score *= 0.1;
    if (this.sessionData.skipped.has(video.id)) score *= 0.3;
    if (this.sessionData.replayed.has(video.id)) score *= 1.5;

    const finalScore = Math.max(0, score);
    
    // Cache result
    this.scoreCache.set(cacheKey, finalScore);
    
    return finalScore;
  }

  clearExpiredCache() {
    const now = Date.now();
    const expiredKeys = [];
    
    this.scoreCache.forEach((value, key) => {
      const keyTime = parseInt(key.split('-').pop());
      if (now - keyTime > this.cacheExpiry) {
        expiredKeys.push(key);
      }
    });
    
    expiredKeys.forEach(key => this.scoreCache.delete(key));
  }

  diversifyFeed(videos) {
    const result = [];
    const creatorLastIndex = new Map();
    const minGap = 3;

    videos.forEach(video => {
      const creator = video.created_by;
      const lastIndex = creatorLastIndex.get(creator);

      if (lastIndex === undefined || result.length - lastIndex >= minGap) {
        result.push(video);
        creatorLastIndex.set(creator, result.length - 1);
      } else {
        result.push(video);
      }
    });

    return result;
  }

  // Optimized tracking methods
  trackVideoWatched(videoId, watchTime, videoDuration) {
    this.sessionData.watched.add(videoId);
    this.sessionData.watchTimes.set(videoId, watchTime);
    
    const completionRate = videoDuration > 0 ? watchTime / videoDuration : 0;
    this.updateEngagementMetrics('watch', completionRate);
    
    // Debounced save
    this.debouncedSave();
  }

  trackVideoSkipped(videoId, video) {
    this.sessionData.skipped.add(videoId);
    this.updateCreatorPreference(video.created_by, -0.5);
    
    if (video.tags) {
      video.tags.forEach(tag => this.updateHashtagPreference(tag, -0.3));
    }
    
    this.debouncedSave();
  }

  trackLike(videoId, video) {
    this.sessionData.liked.add(videoId);
    this.updateCreatorPreference(video.created_by, 2);
    
    if (video.tags) {
      video.tags.forEach(tag => this.updateHashtagPreference(tag, 1));
    }
    
    this.updateEngagementMetrics('like');
    this.debouncedSave();
  }

  trackReplay(videoId, video) {
    this.sessionData.replayed.add(videoId);
    this.updateCreatorPreference(video.created_by, 3);
    
    if (video.tags) {
      video.tags.forEach(tag => this.updateHashtagPreference(tag, 1.5));
    }
    
    this.debouncedSave();
  }

  trackComment(videoId, video) {
    this.updateCreatorPreference(video.created_by, 2.5);
    
    if (video.tags) {
      video.tags.forEach(tag => this.updateHashtagPreference(tag, 1.2));
    }
    
    this.updateEngagementMetrics('comment');
    this.debouncedSave();
  }

  updateCreatorPreference(creatorEmail, delta) {
    if (!this.userProfile.preferences.creators) {
      this.userProfile.preferences.creators = {};
    }
    const current = this.userProfile.preferences.creators[creatorEmail] || 0;
    this.userProfile.preferences.creators[creatorEmail] = 
      Math.max(0, Math.min(100, current + delta));
  }

  updateHashtagPreference(tag, delta) {
    if (!this.userProfile.preferences.hashtags) {
      this.userProfile.preferences.hashtags = {};
    }
    const current = this.userProfile.preferences.hashtags[tag] || 0;
    this.userProfile.preferences.hashtags[tag] = 
      Math.max(0, Math.min(100, current + delta));
  }

  updateEngagementMetrics(action, value = 1) {
    if (!this.userProfile.engagement) {
      this.userProfile.engagement = {
        totalVideos: 0,
        totalLikes: 0,
        totalComments: 0,
        avgCompletionRate: 0
      };
    }

    switch (action) {
      case 'watch':
        this.userProfile.engagement.totalVideos++;
        const prevAvg = this.userProfile.engagement.avgCompletionRate;
        const total = this.userProfile.engagement.totalVideos;
        this.userProfile.engagement.avgCompletionRate = 
          (prevAvg * (total - 1) + value) / total;
        break;
      case 'like':
        this.userProfile.engagement.totalLikes++;
        break;
      case 'comment':
        this.userProfile.engagement.totalComments++;
        break;
    }
  }

  resetSession() {
    this.sessionData = {
      watched: new Set(),
      liked: new Set(),
      skipped: new Set(),
      replayed: new Set(),
      watchTimes: new Map(),
      interactions: []
    };
  }

  // Cleanup on unmount
  destroy() {
    this.debouncedSave.cancel();
    this.scoreCache.clear();
  }
}

export default new ReelsAlgorithmOptimized();