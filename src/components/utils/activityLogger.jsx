import { UserActivity } from '@/entities/UserActivity';

let sessionId = null;
let activityQueue = [];
let isProcessing = false;
let lastFlush = Date.now();

const FLUSH_INTERVAL = 5000; // 5 Sekunden
const MAX_QUEUE_SIZE = 20;

/**
 * Initialisiert Activity Tracking Session
 */
export const initActivitySession = () => {
  if (!sessionId) {
    sessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('📊 Activity Session started:', sessionId);

    // Auto-Flush Intervall
    setInterval(() => {
      if (activityQueue.length > 0) {
        flushActivityQueue();
      }
    }, FLUSH_INTERVAL);
  }
  return sessionId;
};

/**
 * Loggt eine Activity
 */
const logActivity = async (eventData) => {
  if (!sessionId) {
    initActivitySession();
  }

  activityQueue.push({
    ...eventData,
    session_id: sessionId,
    timestamp: new Date().toISOString(),
    network_type: getNetworkType(),
    device_type: getDeviceType()
  });

  // Auto-Flush wenn Queue voll
  if (activityQueue.length >= MAX_QUEUE_SIZE) {
    await flushActivityQueue();
  }
};

/**
 * Schreibt Queue in Datenbank
 */
const flushActivityQueue = async () => {
  if (isProcessing || activityQueue.length === 0) return;

  isProcessing = true;
  const toFlush = [...activityQueue];
  activityQueue = [];

  try {
    await UserActivity.bulkCreate(toFlush);
    console.log(`✅ Flushed ${toFlush.length} activities`);
  } catch (error) {
    console.error('Failed to flush activities:', error);
    // Bei Fehler zurück in Queue
    activityQueue = [...toFlush, ...activityQueue];
  } finally {
    isProcessing = false;
    lastFlush = Date.now();
  }
};

/**
 * Helper: Network Type
 */
const getNetworkType = () => {
  if ('connection' in navigator) {
    const conn = navigator.connection;
    return conn.type === 'wifi' ? 'wifi' : 'cell';
  }
  return 'unknown';
};

/**
 * Helper: Device Type
 */
const getDeviceType = () => {
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return 'mobile';
  if (/tablet/i.test(ua)) return 'tablet';
  return 'desktop';
};

/**
 * PUBLIC API
 */

export const logImpression = (userEmail, postId, creatorId, tab) => {
  logActivity({
    user_email: userEmail,
    event_type: 'impression',
    post_id: postId,
    creator_id: creatorId,
    tab
  });
};

export const logLike = (userEmail, postId, creatorId, tab) => {
  logActivity({
    user_email: userEmail,
    event_type: 'like',
    post_id: postId,
    creator_id: creatorId,
    tab
  });
};

export const logComment = (userEmail, postId, creatorId, tab) => {
  logActivity({
    user_email: userEmail,
    event_type: 'comment',
    post_id: postId,
    creator_id: creatorId,
    tab
  });
};

export const logShare = (userEmail, postId, creatorId, tab) => {
  logActivity({
    user_email: userEmail,
    event_type: 'share',
    post_id: postId,
    creator_id: creatorId,
    tab
  });
};

export const logVideoWatch = (userEmail, postId, creatorId, watchTimeMs, completionPct) => {
  logActivity({
    user_email: userEmail,
    event_type: watchTimeMs >= 30000 ? 'watch_30s' : 'watch_start',
    post_id: postId,
    creator_id: creatorId,
    watch_time_ms: watchTimeMs,
    completion_pct: completionPct
  });
};

export const logHide = (userEmail, postId) => {
  logActivity({
    user_email: userEmail,
    event_type: 'hide',
    post_id: postId
  });
};

export const logReport = (userEmail, postId) => {
  logActivity({
    user_email: userEmail,
    event_type: 'report',
    post_id: postId
  });
};

// Cleanup bei Page Unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (activityQueue.length > 0) {
      flushActivityQueue();
    }
  });
}