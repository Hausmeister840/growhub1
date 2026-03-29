import { base44 } from '@/api/base44Client';

class FeedPersonalizationService {
  constructor() {
    this.activityQueue = [];
    this.flushInterval = null;
    this.startAutoFlush();
  }

  // Track user activity for interest profiling
  async trackActivity(actionType, metadata) {
    const activity = {
      action_type: actionType,
      metadata,
      timestamp: new Date().toISOString()
    };

    this.activityQueue.push(activity);

    // Flush if queue is full
    if (this.activityQueue.length >= 10) {
      await this.flush();
    }
  }

  // Track post view
  trackPostView(post) {
    this.trackActivity('view', {
      target_type: 'post',
      target_id: post.id,
      author_email: post.created_by,
      tags: post.tags || [],
      category: post.category,
      post_type: post.type
    });
  }

  // Track post interaction
  trackPostInteraction(post, interactionType) {
    this.trackActivity(interactionType, {
      target_type: 'post',
      target_id: post.id,
      author_email: post.created_by,
      tags: post.tags || [],
      category: post.category,
      post_type: post.type
    });
  }

  // Track story view
  trackStoryView(story) {
    this.trackActivity('story_view', {
      target_type: 'story',
      target_id: story.id,
      author_email: story.created_by
    });
  }

  // Flush activity queue to database
  async flush() {
    if (this.activityQueue.length === 0) return;

    try {
      const user = await base44.auth.me();
      if (!user) return;

      const activities = this.activityQueue.splice(0, this.activityQueue.length);
      
      // Batch create activities
      await base44.entities.UserActivity.bulkCreate(
        activities.map(activity => ({
          user_email: user.email,
          ...activity
        }))
      );
    } catch (error) {
      console.error('Failed to flush activity queue:', error);
      // Don't re-throw - activity tracking is non-critical
    }
  }

  // Start auto-flush interval
  startAutoFlush() {
    if (this.flushInterval) return;
    
    // Flush every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 30000);
  }

  // Stop auto-flush interval
  stopAutoFlush() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  // Cleanup
  destroy() {
    this.stopAutoFlush();
    this.flush(); // Final flush
  }
}

export const feedPersonalizationService = new FeedPersonalizationService();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    feedPersonalizationService.destroy();
  });
}