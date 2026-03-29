import { useState, useCallback } from 'react';

/**
 * 🎯 OPTIMISTIC UPDATE HOOK
 * Instagram-Style: UI reagiert SOFORT, dann Sync mit Backend
 */
export function useOptimisticUpdate(initialData, updateFn) {
  const [data, setData] = useState(initialData);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  const update = useCallback(async (optimisticData, serverUpdateFn) => {
    // 1. SOFORT: UI Update (Optimistic)
    const previousData = data;
    setData(optimisticData);
    setIsUpdating(true);
    setError(null);

    try {
      // 2. Backend Update
      const result = await serverUpdateFn();
      
      // 3. Falls Backend andere Daten zurückgibt, überschreiben
      if (result) {
        setData(result);
      }
    } catch (err) {
      // 4. Rollback bei Fehler
      setData(previousData);
      setError(err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [data]);

  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
  }, [initialData]);

  return {
    data,
    isUpdating,
    error,
    update,
    reset,
    setData
  };
}