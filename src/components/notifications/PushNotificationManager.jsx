import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function PushNotificationManager({ currentUser }) {
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    if (!currentUser) return;
    if (!('Notification' in window)) return;

    setPermission(Notification.permission);

    // Check if user wants push notifications
    if (currentUser.settings?.pushEnabled && Notification.permission === 'default') {
      requestPermission();
    }
  }, [currentUser]);

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        toast.success('Push-Benachrichtigungen aktiviert!');
      } else {
        toast.info('Du kannst Benachrichtigungen später in den Einstellungen aktivieren');
      }
    } catch (error) {
      console.error('Push permission error:', error);
    }
  };

  return null;
}