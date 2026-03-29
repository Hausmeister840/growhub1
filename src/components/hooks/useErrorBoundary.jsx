import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export function useErrorBoundary() {
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleError = (event) => {
      console.error('Global error:', event.error);
      setError(event.error);
      toast.error('Ein Fehler ist aufgetreten');
    };

    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      setError(event.reason);
      toast.error('Ein Fehler ist aufgetreten');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const clearError = () => setError(null);

  return { error, clearError };
}