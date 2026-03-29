import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { 
  Bell, X, Heart, MessageCircle, Users, 
  Sparkles, TrendingUp, Award, Gift, Loader2,
  ChevronRight, CheckCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { buildUserLookup, fetchUsersByEmails } from '@/api/userDirectory';

const NOTIFICATION_ICONS = {
  reaction: Heart,
  like: Heart,
  comment: MessageCircle,
  follow: Users,
  achievement: Award,
  challenge: Sparkles,
  trending: TrendingUp,
  reward: Gift,
  system: Bell
};

const NOTIFICATION_COLORS = {
  reaction: 'text-pink-400 bg-pink-500/10',
  like: 'text-red-400 bg-red-500/10',
  comment: 'text-blue-400 bg-blue-500/10',
  follow: 'text-green-400 bg-green-500/10',
  achievement: 'text-amber-400 bg-amber-500/10',
  challenge: 'text-purple-400 bg-purple-500/10',
  trending: 'text-orange-400 bg-orange-500/10',
  reward: 'text-yellow-400 bg-yellow-500/10',
  system: 'text-zinc-400 bg-zinc-500/10'
};

export default function NotificationCenter({ isOpen, onClose, currentUser }) {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'mentions'
  const [users, setUsers] = useState({});
  
  const navigate = useNavigate();

  // ✅ Lade Benachrichtigungen
  const loadNotifications = useCallback(async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const notifs = await base44.entities.Notification.filter(
        { recipient_email: currentUser.email },
        '-created_date',
        50
      );
      
      setNotifications(notifs);
      
      // Lade Sender-User-Infos
      const senderEmails = [...new Set(notifs.map(n => n.sender_email).filter(Boolean))];
      if (senderEmails.length > 0) {
        const senderUsers = await fetchUsersByEmails(senderEmails);
        setUsers(buildUserLookup(senderUsers));
      } else {
        setUsers({});
      }
      
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Fehler beim Laden der Benachrichtigungen');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  // ✅ Gefilterte Benachrichtigungen
  const filteredNotifications = useMemo(() => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter(n => !n.read);
    if (filter === 'mentions') return notifications.filter(n => 
      n.type === 'comment' || n.type === 'reaction'
    );
    return notifications;
  }, [notifications, filter]);

  // ✅ Ungelesene Count
  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.read).length, 
    [notifications]
  );

  // ✅ Markiere als gelesen
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await base44.entities.Notification.update(notificationId, { read: true });
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // ✅ Alle als gelesen markieren
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      await Promise.all(unreadIds.map(id => base44.entities.Notification.update(id, { read: true })));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('Alle als gelesen markiert');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Fehler beim Markieren');
    }
  }, [notifications]);

  // ✅ Notification Click Handler
  const handleNotificationClick = useCallback((notification) => {
    markAsRead(notification.id);
    
    // Navigation basierend auf Notification-Typ
    if (notification.post_id) {
      navigate(createPageUrl(`PostDetail?id=${notification.post_id}`));
      onClose();
    } else if (notification.type === 'follow' && notification.sender_email) {
      navigate(createPageUrl(`Profile?id=${notification.sender_email}`));
      onClose();
    }
  }, [navigate, onClose, markAsRead]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-black border-l border-zinc-800 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-xl border-b border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Benachrichtigungen</h2>
                  {unreadCount > 0 && (
                    <p className="text-xs text-zinc-400">{unreadCount} ungelesen</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-green-400 hover:text-green-300"
                  >
                    <CheckCheck className="w-4 h-4 mr-1" />
                    Alle
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('all')}
                className={filter === 'all' ? 'bg-zinc-800' : ''}
              >
                Alle
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('unread')}
                className={filter === 'unread' ? 'bg-zinc-800' : ''}
              >
                Ungelesen
                {unreadCount > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-green-500 text-black text-xs font-bold rounded-full">
                    {unreadCount}
                  </span>
                )}
              </Button>
              <Button
                variant={filter === 'mentions' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('mentions')}
                className={filter === 'mentions' ? 'bg-zinc-800' : ''}
              >
                Erwähnungen
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto h-[calc(100vh-140px)] p-4 space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-zinc-600" />
                </div>
                <p className="text-zinc-400 text-sm">Keine Benachrichtigungen</p>
                <p className="text-zinc-600 text-xs mt-1">
                  {filter === 'unread' ? 'Alles gelesen!' : 'Interagiere mit Posts, um Benachrichtigungen zu erhalten'}
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredNotifications.map((notification) => {
                  const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
                  const colorClass = NOTIFICATION_COLORS[notification.type] || NOTIFICATION_COLORS.system;
                  const sender = users[notification.sender_email];
                  
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      onClick={() => handleNotificationClick(notification)}
                      className={`relative p-4 rounded-xl cursor-pointer transition-all hover:bg-zinc-900/50 ${
                        !notification.read ? 'bg-zinc-900/30 border border-green-500/20' : 'bg-zinc-900/10'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Sender Avatar oder Icon */}
                        {sender?.avatar_url ? (
                          <img
                            src={sender.avatar_url}
                            alt={sender.full_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white leading-relaxed">
                            {notification.message}
                          </p>
                          <p className="text-xs text-zinc-500 mt-1">
                            {formatDistanceToNow(new Date(notification.created_date), { 
                              addSuffix: true, 
                              locale: de 
                            })}
                          </p>
                        </div>

                        {/* Unread Indicator */}
                        {!notification.read && (
                          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-2" />
                        )}

                        {/* Arrow */}
                        <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0 mt-1" />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
