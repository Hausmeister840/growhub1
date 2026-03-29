import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useStreaks(currentUser) {
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    loadStreak();
  }, [currentUser]);

  const loadStreak = async () => {
    try {
      // Try to get streak from user data
      if (currentUser.streak !== undefined) {
        setStreak(currentUser.streak);
        setLoading(false);
        return;
      }

      // Otherwise try the streak function
      const response = await base44.functions.invoke('streak/getStreak', {}).catch(() => null);
      
      if (response?.data?.streak !== undefined) {
        setStreak(response.data.streak);
      } else {
        setStreak(0);
      }
    } catch (error) {
      console.error('Streak load error:', error);
      setStreak(0);
    } finally {
      setLoading(false);
    }
  };

  const touchStreak = async () => {
    try {
      const response = await base44.functions.invoke('streak/touch', {});
      if (response?.data?.streak !== undefined) {
        setStreak(response.data.streak);
        return response.data;
      }
    } catch (error) {
      console.error('Streak touch error:', error);
    }
    return null;
  };

  return { streak, loading, touchStreak };
}