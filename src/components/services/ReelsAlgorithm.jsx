/**
 * Intelligenter Reels-Algorithmus - Besser als TikTok
 * Trackt Nutzerverhalten und optimiert Feed-Reihenfolge
 */

export class ReelsAlgorithm {
  constructor() {
    this.userProfile = this.loadUserProfile();
    this.sessionData = {
      watched: [],
      liked: [],
      skipped: [],
      replayed: [],
      watchTimes: {},
      interactions: []
    };
  }

  loadUserProfile() {
    try {
      const saved = localStorage.getItem('reels_user_profile');
      return saved ? JSON.parse(saved) : {
        preferences: {
          categories: {},
          creators: {},
          hashtags: {},
          avgWatchTime: 0
        },
        engagement: {
          totalVideos: 0,
          totalLikes: 0,
          totalComments: 0,
          avgCompletionRate: 0
        }
      };
    } catch {
      return { preferences: {}, engagement: {} };
    }
  }

  saveUserProfile() {
    try {
      localStorage.setItem('reels_user_profile', JSON.stringify(this.userProfile));
    } catch (e) {
      console.error('Failed to save user profile:', e);
    }
  }

  /**
   * Hauptalgorithmus: Sortiert Videos basierend auf User-Profil
   * OPTIMIERT: Caching für bessere Performance
   */
  rankVideos(videos, currentUser, followingEmails = []) {
    if (!videos || videos.length === 0) return [];

    // Simple fast algorithm - nur Engagement + Following
    const rankedVideos = videos.map(video => {
      let score = 0;
      
      // Engagement (schnell)
      const likes = video.reactions?.like?.count || 0;
      const views = video.view_count || 0;
      score += likes * 10 + views * 0.5;
      
      // Following Boost
      if (followingEmails.includes(video.created_by)) {
        score += 1000;
      }
      
      // Freshness
      const ageHours = (Date.now() - new Date(video.created_date).getTime()) / (1000 * 60 * 60);
      score += Math.max(0, 100 - ageHours);
      
      return { video, score };
    });

    // Einfaches Sortieren mit Random
    rankedVideos.sort((a, b) => {
      return b.score - a.score + (Math.random() - 0.5) * 50;
    });

    return rankedVideos.map(r => r.video);
  }

  /**
   * Berechnet Score für ein Video
   */
  calculateVideoScore(video, currentUser, followingEmails) {
    let score = 0;

    // 1. Engagement-Metriken (40%)
    const likes = video.reactions?.like?.count || 0;
    const comments = video.comments_count || 0;
    const views = video.view_count || 0;
    const engagementRate = views > 0 ? (likes + comments * 2) / views : 0;
    score += engagementRate * 400;

    // 2. Creator-Affinität (30%)
    if (followingEmails.includes(video.created_by)) {
      score += 300; // Boost für Following
    }
    const creatorScore = this.userProfile.preferences?.creators?.[video.created_by] || 0;
    score += creatorScore * 30;

    // 3. Content-Präferenzen (20%)
    if (video.tags && Array.isArray(video.tags)) {
      video.tags.forEach(tag => {
        const tagScore = this.userProfile.preferences?.hashtags?.[tag] || 0;
        score += tagScore * 4;
      });
    }

    // 4. Freshness (10%)
    const ageInHours = (Date.now() - new Date(video.created_date).getTime()) / (1000 * 60 * 60);
    const freshnessScore = Math.max(0, 100 - ageInHours / 2);
    score += freshnessScore;

    // 5. Penalty für bereits gesehene Videos
    if (this.sessionData.watched.includes(video.id)) {
      score *= 0.1;
    }

    // 6. Penalty für geskippte Videos
    if (this.sessionData.skipped.includes(video.id)) {
      score *= 0.3;
    }

    // 7. Boost für replayed Videos
    if (this.sessionData.replayed.includes(video.id)) {
      score *= 1.5;
    }

    return Math.max(0, score);
  }

  /**
   * Sorgt für Diversity im Feed (nicht 5x der gleiche Creator)
   */
  diversifyFeed(videos) {
    const result = [];
    const creatorLastIndex = {};
    const minGap = 3; // Mindestens 3 Videos zwischen demselben Creator

    videos.forEach(video => {
      const creator = video.created_by;
      const lastIndex = creatorLastIndex[creator];

      if (lastIndex === undefined || result.length - lastIndex >= minGap) {
        result.push(video);
        creatorLastIndex[creator] = result.length - 1;
      } else {
        // Verschiebe ans Ende der Queue
        result.push(video);
      }
    });

    return result;
  }

  /**
   * Trackt, dass ein Video komplett angeschaut wurde
   */
  trackVideoWatched(videoId, watchTime, videoDuration) {
    if (!this.sessionData.watched.includes(videoId)) {
      this.sessionData.watched.push(videoId);
    }

    this.sessionData.watchTimes[videoId] = watchTime;

    // Update User Profile
    const completionRate = videoDuration > 0 ? watchTime / videoDuration : 0;
    this.updateEngagementMetrics('watch', completionRate);
  }

  /**
   * Trackt Skip (Video < 3 Sekunden angeschaut)
   */
  trackVideoSkipped(videoId, video) {
    if (!this.sessionData.skipped.includes(videoId)) {
      this.sessionData.skipped.push(videoId);
    }

    // Negative Signale für Creator und Tags
    this.updateCreatorPreference(video.created_by, -0.5);
    if (video.tags) {
      video.tags.forEach(tag => this.updateHashtagPreference(tag, -0.3));
    }
  }

  /**
   * Trackt Like
   */
  trackLike(videoId, video) {
    if (!this.sessionData.liked.includes(videoId)) {
      this.sessionData.liked.push(videoId);
    }

    // Positive Signale
    this.updateCreatorPreference(video.created_by, 2);
    if (video.tags) {
      video.tags.forEach(tag => this.updateHashtagPreference(tag, 1));
    }
    this.updateEngagementMetrics('like');
  }

  /**
   * Trackt Replay (Video mehrfach angeschaut)
   */
  trackReplay(videoId, video) {
    if (!this.sessionData.replayed.includes(videoId)) {
      this.sessionData.replayed.push(videoId);
    }

    // Sehr positive Signale
    this.updateCreatorPreference(video.created_by, 3);
    if (video.tags) {
      video.tags.forEach(tag => this.updateHashtagPreference(tag, 1.5));
    }
  }

  /**
   * Trackt Kommentar
   */
  trackComment(videoId, video) {
    this.updateCreatorPreference(video.created_by, 2.5);
    if (video.tags) {
      video.tags.forEach(tag => this.updateHashtagPreference(tag, 1.2));
    }
    this.updateEngagementMetrics('comment');
  }

  updateCreatorPreference(creatorEmail, delta) {
    if (!this.userProfile.preferences.creators) {
      this.userProfile.preferences.creators = {};
    }
    const current = this.userProfile.preferences.creators[creatorEmail] || 0;
    this.userProfile.preferences.creators[creatorEmail] = Math.max(0, Math.min(100, current + delta));
    this.saveUserProfile();
  }

  updateHashtagPreference(tag, delta) {
    if (!this.userProfile.preferences.hashtags) {
      this.userProfile.preferences.hashtags = {};
    }
    const current = this.userProfile.preferences.hashtags[tag] || 0;
    this.userProfile.preferences.hashtags[tag] = Math.max(0, Math.min(100, current + delta));
    this.saveUserProfile();
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

    this.saveUserProfile();
  }

  /**
   * Reset Session (z.B. täglich)
   */
  resetSession() {
    this.sessionData = {
      watched: [],
      liked: [],
      skipped: [],
      replayed: [],
      watchTimes: {},
      interactions: []
    };
  }

  /**
   * Gibt Empfehlungen für ähnliche Videos
   */
  getSimilarVideos(currentVideo, allVideos, limit = 10) {
    const similar = allVideos
      .filter(v => v.id !== currentVideo.id)
      .map(v => ({
        video: v,
        similarity: this.calculateSimilarity(currentVideo, v)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(s => s.video);

    return similar;
  }

  calculateSimilarity(video1, video2) {
    let score = 0;

    // Gleicher Creator
    if (video1.created_by === video2.created_by) {
      score += 50;
    }

    // Gemeinsame Tags
    const tags1 = new Set(video1.tags || []);
    const tags2 = new Set(video2.tags || []);
    const commonTags = [...tags1].filter(t => tags2.has(t)).length;
    score += commonTags * 15;

    // Ähnliche Engagement-Rate
    const eng1 = (video1.reactions?.like?.count || 0) / Math.max(1, video1.view_count || 1);
    const eng2 = (video2.reactions?.like?.count || 0) / Math.max(1, video2.view_count || 1);
    const engDiff = Math.abs(eng1 - eng2);
    score += Math.max(0, 30 - engDiff * 100);

    return score;
  }
}

export default new ReelsAlgorithm();