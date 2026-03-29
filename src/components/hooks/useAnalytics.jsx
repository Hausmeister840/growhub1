import { useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * 📊 ANALYTICS HOOK
 * Tracks user behavior and app performance
 */

const BATCH_SIZE = 10;
const BATCH_INTERVAL = 5000; // 5 seconds

class AnalyticsService {
  constructor() {
    this.queue = [];
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.isOnline = navigator.onLine;
    
    // Auto-flush on interval
    setInterval(() => this.flush(), BATCH_INTERVAL);
    
    // Flush on page unload
    window.addEventListener('beforeunload', () => this.flush(true));
    
    // Track online/offline
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flush();
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  track(eventType, data = {}) {
    const event = {
      event_type: eventType,
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
      user_email: window.currentUserEmail || 'anonymous',
      ...data
    };

    this.queue.push(event);

    // Auto-flush if queue is full
    if (this.queue.length >= BATCH_SIZE) {
      this.flush();
    }
  }

  async flush(sync = false) {
    if (this.queue.length === 0 || !this.isOnline) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      if (sync && navigator.sendBeacon) {
        // Use sendBeacon for unload events
        const blob = new Blob([JSON.stringify(events)], { type: 'application/json' });
        navigator.sendBeacon('/api/analytics/batch', blob);
      } else {
        // Regular batch insert
        await base44.entities.UserActivity.bulkCreate(events);
      }
      
      console.log('📊 Analytics batch sent:', events.length, 'events');
    } catch (error) {
      console.error('❌ Analytics error:', error);
      // Re-queue on error
      this.queue.unshift(...events);
    }
  }

  // Track page view
  trackPageView(pageName) {
    this.track('page_view', {
      page_name: pageName,
      referrer: document.referrer,
      device_type: this.getDeviceType()
    });
  }

  // Track post impression
  trackImpression(postId, creatorId, tab) {
    this.track('impression', {
      post_id: postId,
      creator_id: creatorId,
      tab
    });
  }

  // Track video watch
  trackVideoWatch(postId, watchTimeMs, completionPct) {
    this.track('watch_30s', {
      post_id: postId,
      watch_time_ms: watchTimeMs,
      completion_pct: completionPct
    });
  }

  // Track interaction
  trackInteraction(type, postId, data = {}) {
    this.track(type, {
      post_id: postId,
      ...data
    });
  }

  // Track performance
  trackPerformance(metric, value, context = {}) {
    this.track('performance', {
      metric,
      value,
      ...context
    });
  }

  getDeviceType() {
    const width = window.innerWidth;
    if (width < 640) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  getNetworkType() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return connection?.effectiveType || 'unknown';
  }
}

// Singleton instance
const analytics = new AnalyticsService();

export function useAnalytics() {
  const viewedPosts = useRef(new Set());
  const watchTimers = useRef(new Map());

  // Track page view
  const trackPageView = useCallback((pageName) => {
    analytics.trackPageView(pageName);
  }, []);

  // Track post impression (when it enters viewport)
  const trackImpression = useCallback((post, tab) => {
    if (!post?.id || viewedPosts.current.has(post.id)) return;
    
    viewedPosts.current.add(post.id);
    analytics.trackImpression(post.id, post.created_by, tab);
  }, []);

  // Track video watch start
  const trackWatchStart = useCallback((postId) => {
    if (watchTimers.current.has(postId)) return;
    
    const startTime = Date.now();
    watchTimers.current.set(postId, startTime);
    
    analytics.trackInteraction('watch_start', postId);
  }, []);

  // Track video watch progress
  const trackWatchProgress = useCallback((postId, completionPct) => {
    const startTime = watchTimers.current.get(postId);
    if (!startTime) return;

    const watchTimeMs = Date.now() - startTime;

    if (completionPct >= 30 && completionPct < 100) {
      analytics.trackVideoWatch(postId, watchTimeMs, completionPct);
    } else if (completionPct >= 100) {
      analytics.track('watch_100', {
        post_id: postId,
        watch_time_ms: watchTimeMs,
        completion_pct: 100
      });
      watchTimers.current.delete(postId);
    }
  }, []);

  // Track like
  const trackLike = useCallback((postId) => {
    analytics.trackInteraction('like', postId);
  }, []);

  // Track comment
  const trackComment = useCallback((postId) => {
    analytics.trackInteraction('comment', postId);
  }, []);

  // Track share
  const trackShare = useCallback((postId, method) => {
    analytics.trackInteraction('share', postId, { method });
  }, []);

  // Track save
  const trackSave = useCallback((postId) => {
    analytics.trackInteraction('save', postId);
  }, []);

  // Track follow
  const trackFollow = useCallback((creatorId) => {
    analytics.trackInteraction('follow_creator', null, { creator_id: creatorId });
  }, []);

  // Track hide
  const trackHide = useCallback((postId, reason) => {
    analytics.trackInteraction('hide', postId, { reason });
  }, []);

  // Track report
  const trackReport = useCallback((postId, reason) => {
    analytics.trackInteraction('report', postId, { reason });
  }, []);

  // Track performance metric
  const trackPerformance = useCallback((metric, value, context) => {
    analytics.trackPerformance(metric, value, context);
  }, []);

  return {
    trackPageView,
    trackImpression,
    trackWatchStart,
    trackWatchProgress,
    trackLike,
    trackComment,
    trackShare,
    trackSave,
    trackFollow,
    trackHide,
    trackReport,
    trackPerformance
  };
}

export default useAnalytics;