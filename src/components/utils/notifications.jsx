// ✅ SAFE NOTIFICATION UTILITIES

export const requestNotificationPermission = async () => {
  // Check if notifications are supported
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return 'denied';
  }

  // Check current permission
  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  // ✅ Safe permission request
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    // Silently handle permission errors
    console.log('Notification permission request failed (expected)');
    return 'denied';
  }
};

export const showNotification = async (title, options = {}) => {
  const permission = await requestNotificationPermission();
  
  if (permission !== 'granted') {
    return null;
  }

  try {
    return new Notification(title, {
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      ...options
    });
  } catch (error) {
    console.log('Could not show notification');
    return null;
  }
};

export const checkNotificationSupport = () => {
  return 'Notification' in window;
};