import { useState, useCallback, useRef } from 'react';

/**
 * Batch Update Hook
 * Batches multiple state updates into one render
 */
export function useBatchUpdate(initialState) {
  const [state, setState] = useState(initialState);
  const pendingUpdates = useRef([]);
  const timeoutRef = useRef(null);

  const batchUpdate = useCallback((updater) => {
    pendingUpdates.current.push(updater);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setState(prevState => {
        let newState = prevState;
        
        pendingUpdates.current.forEach(update => {
          newState = typeof update === 'function' ? update(newState) : update;
        });

        pendingUpdates.current = [];
        return newState;
      });
    }, 0);
  }, []);

  const flushUpdates = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      
      setState(prevState => {
        let newState = prevState;
        
        pendingUpdates.current.forEach(update => {
          newState = typeof update === 'function' ? update(newState) : update;
        });

        pendingUpdates.current = [];
        return newState;
      });
    }
  }, []);

  return [state, batchUpdate, flushUpdates];
}