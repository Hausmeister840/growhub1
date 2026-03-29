import { useCallback } from 'react';

/**
 * 📳 HAPTIC FEEDBACK HOOK
 * Provides native-like haptic feedback on supported devices
 */

export function useHapticFeedback() {
  const vibrate = useCallback((pattern) => {
    if (!navigator.vibrate) return;
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      // Silently fail on unsupported devices
    }
  }, []);

  return {
    light: useCallback(() => vibrate(10), [vibrate]),
    medium: useCallback(() => vibrate(20), [vibrate]),
    heavy: useCallback(() => vibrate(30), [vibrate]),
    success: useCallback(() => vibrate([10, 50, 10]), [vibrate]),
    error: useCallback(() => vibrate([50, 100, 50]), [vibrate]),
    impact: useCallback(() => vibrate(15), [vibrate]),
    selection: useCallback(() => vibrate(5), [vibrate])
  };
}