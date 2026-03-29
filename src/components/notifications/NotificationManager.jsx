import { toast } from 'sonner';

/**
 * 🔔 NOTIFICATION MANAGER
 * Handles push notifications and permissions
 */

export class NotificationManager {
  constructor() {
    this.permission = 'default';
    this.subscription = null;
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;

      if (permission === 'granted') {
        console.log('✅ Notification permission granted');
        toast.success('Benachrichtigungen aktiviert!');
        await this.subscribe();
        return true;
      } else if (permission === 'denied') {
        console.warn('❌ Notification permission denied');
        toast.error('Benachrichtigungen wurden blockiert');
        return false;
      }

      return false;
    } catch (error) {
      console.error('Notification permission error:', error);
      return false;
    }
  }

  async subscribe() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Subscribe to push notifications
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(
            'YOUR_VAPID_PUBLIC_KEY' // Replace with actual VAPID key
          )
        });

        console.log('✅ Push subscription created');
      }

      this.subscription = subscription;
      return subscription;

    } catch (error) {
      console.error('Push subscription error:', error);
      return null;
    }
  }

  async unsubscribe() {
    if (!this.subscription) return;

    try {
      await this.subscription.unsubscribe();
      this.subscription = null;
      console.log('✅ Push subscription removed');
      toast.success('Benachrichtigungen deaktiviert');
    } catch (error) {
      console.error('Unsubscribe error:', error);
    }
  }

  showNotification(title, options = {}) {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
        tag: 'growhub-notification',
        renotify: true,
        ...options
      });

      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        if (options.url) {
          window.location.href = options.url;
        }
        notification.close();
      };

      return notification;
    }
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export const notificationManager = new NotificationManager();

// Check permission on load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    if ('Notification' in window) {
      notificationManager.permission = Notification.permission;
    }
  });
}