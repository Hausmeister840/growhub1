import { useEffect } from 'react';
import realTimeService from '@/components/services/RealTimeService';
import { isRealtimeEnabled } from '@/components/services/SupabaseClient';

export function usePresence(user) {
  useEffect(() => {
    if (!user || !isRealtimeEnabled()) return;

    // Track user presence
    realTimeService.trackPresence(
      user.id,
      user.full_name || user.username,
      user.avatar_url
    );

    // Cleanup on unmount
    return () => {
      // Presence is automatically cleaned up when connection closes
    };
  }, [user]);
}