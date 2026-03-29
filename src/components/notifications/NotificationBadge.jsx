import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';

// Shared cache so multiple badge instances don't each make separate API calls
const badgeCache = { notifications: 0, messages: 0, lastFetch: 0, loading: false, listeners: new Set(), user: null };

async function fetchBadgeCounts() {
  if (badgeCache.loading) return;
  const now = Date.now();
  if (now - badgeCache.lastFetch < 30000) return;
  badgeCache.loading = true;

  try {
    const user = await base44.auth.me();
    if (!user) return;
    badgeCache.user = user;

    const [notifications, conversations] = await Promise.all([
      base44.entities.Notification.filter({ recipient_email: user.email, read: false }, '-created_date', 50),
      base44.entities.Conversation.list('-updated_date', 30), // RLS filters to user's conversations
    ]);

    badgeCache.notifications = (notifications || []).length;
    badgeCache.messages = (conversations || []).reduce((sum, c) => sum + (c.unreadCount?.[user.id] || 0), 0);
    badgeCache.lastFetch = Date.now();
  } catch {
    // silent
  } finally {
    badgeCache.loading = false;
    badgeCache.listeners.forEach(fn => fn());
  }
}

// Realtime subscriptions (initialized once)
let realtimeInitialized = false;
function initRealtime() {
  if (realtimeInitialized) return;
  realtimeInitialized = true;

  base44.entities.Notification.subscribe((event) => {
    if (!badgeCache.user) return;
    const notif = event.data;
    if (event.type !== 'delete' && (!notif || notif.recipient_email !== badgeCache.user.email)) return;
    if (event.type === 'create' && !notif.read) {
      badgeCache.notifications++;
      badgeCache.listeners.forEach(fn => fn());
    } else if (event.type === 'update' || event.type === 'delete') {
      // Any update/delete can otherwise drift the counter out of sync.
      badgeCache.lastFetch = 0;
      fetchBadgeCounts();
    }
  });

  base44.entities.Conversation.subscribe((event) => {
    if (!badgeCache.user) return;
    const conv = event.data;
    if (!conv?.participants?.includes(badgeCache.user.id)) return;
    if (event.type === 'update') {
      // Recalculate — cheaper to just force refresh
      badgeCache.lastFetch = 0;
      fetchBadgeCounts();
    }
  });
}

export default function NotificationBadge({ type = 'all', className = '' }) {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const listener = () => forceUpdate(n => n + 1);
    badgeCache.listeners.add(listener);

    fetchBadgeCounts();
    initRealtime();
    const interval = setInterval(fetchBadgeCounts, 30000);

    const handleRefresh = () => {
      badgeCache.lastFetch = 0;
      fetchBadgeCounts();
    };
    window.addEventListener('refreshNotifications', handleRefresh);

    return () => {
      badgeCache.listeners.delete(listener);
      clearInterval(interval);
      window.removeEventListener('refreshNotifications', handleRefresh);
    };
  }, []);

  let count = 0;
  if (type === 'messages') count = badgeCache.messages;
  else if (type === 'notifications') count = badgeCache.notifications;
  else count = badgeCache.notifications + badgeCache.messages;

  if (count === 0) return null;

  return (
    <AnimatePresence>
      <motion.span
        key={count}
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold px-1 shadow-lg shadow-red-500/30 ${className}`}
      >
        {count > 99 ? '99+' : count}
      </motion.span>
    </AnimatePresence>
  );
}