import { useEffect, useRef, useCallback } from 'react';

/**
 * Web Worker Hook
 * Offloads heavy computations to worker thread
 */
export function useWebWorker(workerFunction) {
  const workerRef = useRef(null);

  useEffect(() => {
    const blob = new Blob([`(${workerFunction.toString()})()`], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    workerRef.current = new Worker(workerUrl);

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        URL.revokeObjectURL(workerUrl);
      }
    };
  }, [workerFunction]);

  const postMessage = useCallback((data) => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const handleMessage = (e) => {
        workerRef.current.removeEventListener('message', handleMessage);
        resolve(e.data);
      };

      const handleError = (e) => {
        workerRef.current.removeEventListener('error', handleError);
        reject(e);
      };

      workerRef.current.addEventListener('message', handleMessage);
      workerRef.current.addEventListener('error', handleError);
      workerRef.current.postMessage(data);
    });
  }, []);

  return postMessage;
}