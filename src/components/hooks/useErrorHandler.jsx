import { useCallback } from 'react';
import { toast } from 'sonner';

/**
 * 🛡️ USE ERROR HANDLER
 * Zentrale Fehlerbehandlung für die gesamte App
 */

export function useErrorHandler() {
  
  const handleError = useCallback((error, context = 'Unknown') => {
    console.error(`❌ Error in ${context}:`, error);

    // Network Errors
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      toast.error('Netzwerkfehler', {
        description: 'Bitte überprüfe deine Internetverbindung'
      });
      return;
    }

    // Authentication Errors
    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      toast.error('Nicht angemeldet', {
        description: 'Bitte melde dich an'
      });
      return;
    }

    // Permission Errors
    if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
      toast.error('Keine Berechtigung', {
        description: 'Du hast keine Berechtigung für diese Aktion'
      });
      return;
    }

    // Not Found Errors
    if (error.message?.includes('404') || error.message?.includes('Not found')) {
      toast.error('Nicht gefunden', {
        description: 'Die angeforderten Daten wurden nicht gefunden'
      });
      return;
    }

    // Rate Limit Errors
    if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
      toast.error('Zu viele Anfragen', {
        description: 'Bitte warte einen Moment und versuche es erneut'
      });
      return;
    }

    // Server Errors
    if (error.message?.includes('500') || error.message?.includes('Internal server error')) {
      toast.error('Serverfehler', {
        description: 'Ein Fehler ist auf dem Server aufgetreten'
      });
      return;
    }

    // Generic Error
    toast.error('Ein Fehler ist aufgetreten', {
      description: error.message || 'Bitte versuche es erneut'
    });
  }, []);

  const handleAsyncError = useCallback(async (asyncFn, context = 'Unknown') => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error, context);
      throw error;
    }
  }, [handleError]);

  return {
    handleError,
    handleAsyncError
  };
}

export default useErrorHandler;