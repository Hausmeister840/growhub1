import { toast } from 'sonner';

class GlobalErrorHandler {
  static handleError(error, context = '') {
    console.error(`[${context}]`, error);

    // Network Errors
    if (error.message?.includes('Network Error') || error.message?.includes('Failed to fetch')) {
      toast.error('Netzwerkfehler', {
        description: 'Bitte überprüfe deine Internetverbindung'
      });
      return;
    }

    // 429 Rate Limit
    if (error.message?.includes('429') || error.response?.status === 429) {
      toast.error('Zu viele Anfragen', {
        description: 'Bitte warte kurz und versuche es erneut'
      });
      return;
    }

    // 401 Unauthorized
    if (error.message?.includes('401') || error.response?.status === 401) {
      toast.error('Nicht angemeldet', {
        description: 'Bitte melde dich an'
      });
      return;
    }

    // 403 Forbidden
    if (error.message?.includes('403') || error.response?.status === 403) {
      toast.error('Zugriff verweigert', {
        description: 'Du hast keine Berechtigung für diese Aktion'
      });
      return;
    }

    // 404 Not Found
    if (error.message?.includes('404') || error.response?.status === 404) {
      toast.error('Nicht gefunden', {
        description: 'Der angeforderte Inhalt existiert nicht'
      });
      return;
    }

    // Default Error
    toast.error('Ein Fehler ist aufgetreten', {
      description: 'Bitte versuche es erneut'
    });
  }

  static async withRetry(operation, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        const isLastRetry = i === maxRetries - 1;
        
        if (isLastRetry) {
          throw error;
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }

  static isNetworkError(error) {
    return error.message?.includes('Network Error') || 
           error.message?.includes('Failed to fetch');
  }

  static isRateLimitError(error) {
    return error.message?.includes('429') || error.response?.status === 429;
  }
}

export default GlobalErrorHandler;