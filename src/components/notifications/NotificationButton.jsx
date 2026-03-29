import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationButton({ currentUser }) {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pulse, setPulse] = useState(false);
  const prevCountRef = useRef(0);

  const load = useCallback(async () => {
    if (!currentUser?.email) return;
    try {
      const notifs = await base44.entities.Notification.filter(
        { recipient_email: currentUser.email, read: false },
        '-created_date',
        50
      );
      const count = (notifs || []).length;
      setUnreadCount(count);
      // Pulse animation when count increases
      if (count > prevCountRef.current) {
        setPulse(true);
        setTimeout(() => setPulse(false), 1000);
      }
      prevCountRef.current = count;
    } catch {}
  }, [currentUser?.email]);

  useEffect(() => {
    if (!currentUser?.email) return;

    load();
    const interval = setInterval(load, 30000);

    const unsub = base44.entities.Notification.subscribe((event) => {
      if (!event.data || event.data.recipient_email !== currentUser.email) return;
      if (event.type === 'create' && !event.data.read) {
        setUnreadCount(prev => {
          const next = prev + 1;
          prevCountRef.current = next;
          setPulse(true);
          setTimeout(() => setPulse(false), 1000);
          return next;
        });
      } else if (event.type === 'update' && event.data.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    });

    // Listen for manual refresh events
    const handleRefresh = () => load();
    window.addEventListener('refreshNotifications', handleRefresh);

    return () => {
      clearInterval(interval);
      unsub();
      window.removeEventListener('refreshNotifications', handleRefresh);
    };
  }, [currentUser?.email, load]);

  if (!currentUser) return null;

  return (
    <button
      onClick={() => navigate('/Notifications')}
      className="relative w-9 h-9 flex items-center justify-center rounded-full text-[var(--gh-text-secondary)] hover:text-white hover:bg-white/[0.06] transition-all"
      aria-label="Benachrichtigungen"
    >
      <Bell className={`w-[19px] h-[19px] transition-transform ${pulse ? 'animate-bounce' : ''}`} strokeWidth={1.8} />
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg shadow-red-500/30"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}