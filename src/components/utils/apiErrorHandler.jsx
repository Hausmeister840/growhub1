/**
 * API Error Handler
 * Zentrale Fehlerbehandlung für API-Calls
 */

export const handleApiError = (error, fallbackMessage = 'Ein Fehler ist aufgetreten') => {
  console.error('API Error:', error);
  
  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return {
      success: false,
      message: 'Keine Internetverbindung. Bitte prüfe deine Verbindung.',
      type: 'network'
    };
  }
  
  if (error.status === 429) {
    return {
      success: false,
      message: 'Zu viele Anfragen. Bitte warte einen Moment.',
      type: 'rate_limit'
    };
  }
  
  if (error.status === 401 || error.status === 403) {
    return {
      success: false,
      message: 'Bitte melde dich erneut an.',
      type: 'auth'
    };
  }
  
  return {
    success: false,
    message: fallbackMessage,
    type: 'unknown'
  };
};

/**
 * Wrapper für API-Calls mit Retry
 */
export const apiCall = async (fn, options = {}) => {
  const { retries = 2, delay = 1000 } = options;
  
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries) {
        return handleApiError(error);
      }
      await new Promise(r => setTimeout(r, delay * (i + 1)));
    }
  }
};