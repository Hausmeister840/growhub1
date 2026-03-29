import { base44 } from '@/api/base44Client';

// In-memory dedup cache: key → timestamp (ms)
const recentNotifications = new Map();
const DEDUP_WINDOW_MS = 30_000; // 30 seconds

function getDedupeKey({ recipientEmail, senderEmail, type, postId }) {
  return `${type}:${senderEmail}:${recipientEmail}:${postId || ''}`;
}

/**
 * Creates a notification record in the database.
 * Deduplicates: same sender+recipient+type+post within 30s → skip.
 */
export async function createNotification({ recipientEmail, senderEmail, senderId, type, message, postId, conversationId }) {
  // Don't notify yourself
  if (!recipientEmail || recipientEmail === senderEmail) return;

  // Dedup check
  const key = getDedupeKey({ recipientEmail, senderEmail, type, postId });
  const now = Date.now();
  const lastSent = recentNotifications.get(key);
  if (lastSent && (now - lastSent) < DEDUP_WINDOW_MS) return;
  recentNotifications.set(key, now);

  // Clean old entries periodically (keep map small)
  if (recentNotifications.size > 100) {
    for (const [k, ts] of recentNotifications) {
      if (now - ts > DEDUP_WINDOW_MS) recentNotifications.delete(k);
    }
  }

  try {
    await base44.entities.Notification.create({
      recipient_email: recipientEmail,
      sender_email: senderEmail,
      sender_id: senderId,
      type,
      message,
      read: false,
      ...(postId ? { post_id: postId } : {}),
      ...(conversationId ? { conversation_id: conversationId } : {}),
    });
  } catch (error) {
    console.warn('createNotification failed:', error);
  }
}