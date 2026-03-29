import { useState, useEffect, useCallback } from 'react';
// ✅ FIXED: Direct import for Platform V2
import { touchStreak } from '@/functions/streak/touch';

export function useStreak() {
  const [streak, setStreak] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const touchStreakHandler = useCallback(async () => {
    if (isLoading) return streak;
    
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔥 Calling touchStreak function...');
      
      // ✅ FIXED: Direct function call for Platform V2
      const response = await touchStreak();
      
      console.log('📦 Streak response:', response);

      // Handle response properly
      if (response && response.data) {
        const result = response.data;
        
        if (result.ok) {
          console.log('✅ Streak updated successfully:', result.data);
          setStreak(result.data);
          return result.data;
        } else {
          throw new Error(result.message || 'Streak update failed');
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err.message || 'Streak update failed';
      console.warn('⚠️ Streak error:', errorMessage);
      setError(errorMessage);
      
      // Return fallback streak data to prevent UI crashes
      const fallbackStreak = { 
        day_count: 0, 
        longest_streak: 0, 
        already_counted: true,
        is_new: false 
      };
      setStreak(fallbackStreak);
      return fallbackStreak;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, streak]);

  // Auto-touch streak on mount (once per session)
  useEffect(() => {
    const hasCheckedStreak = sessionStorage.getItem('streak_checked');
    if (!hasCheckedStreak) {
      // Add small delay to prevent immediate call on app load
      const timeoutId = setTimeout(() => {
        touchStreakHandler().then(() => {
          sessionStorage.setItem('streak_checked', 'true');
        }).catch(() => {
          console.warn('Initial streak check failed, continuing without streak data');
        });
      }, 1000); // 1 second delay

      return () => clearTimeout(timeoutId);
    }
  }, [touchStreakHandler]);

  return {
    streak,
    touchStreak: touchStreakHandler,
    isLoading,
    error
  };
}