import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import MessageNotification from './MessageNotification';
import messagingService from '../services/MessagingService';

/**
 * 🔔 MESSAGE NOTIFICATION MANAGER
 * - Manages display of message notifications
 * - Max 3 notifications at once
 * - Auto-dismiss after 5 seconds
 */

export default function MessageNotificationManager({ currentUser }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    console.log('🔔 [NotificationManager] Setting up for:', currentUser.email);

    // Listen for new messages
    const unsubscribe = messagingService.subscribe('messages:notification', (data) => {
      if (!data?.messages || data.messages.length === 0) return;

      console.log('🔔 [NotificationManager] New notifications:', data.messages.length);

      // Add notifications (max 3)
      const newNotifications = data.messages.slice(0, 3).map(msg => ({
        id: msg.id,
        message: msg,
        conversation: null, // Will be fetched if needed
        timestamp: Date.now()
      }));

      setNotifications(prev => {
        const updated = [...newNotifications, ...prev].slice(0, 3);
        return updated;
      });
    });

    // Start polling
    const interval = setInterval(() => {
      messagingService.triggerCheck(currentUser.email);
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [currentUser]);

  const handleRemove = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <div className="fixed top-0 right-0 z-50 pointer-events-none">
      <div className="pointer-events-auto space-y-2 p-4">
        <AnimatePresence>
          {notifications.map((notification, index) => (
            <div
              key={notification.id}
              style={{ 
                marginTop: index * 8 
              }}
            >
              <MessageNotification
                message={notification.message}
                conversation={notification.conversation}
                onClose={() => handleRemove(notification.id)}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}