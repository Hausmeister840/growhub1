/**
 * 🛡️ ERROR HANDLER - Zentrales Error Management
 */

class ErrorHandler {
  constructor() {
    this.listeners = new Set();
    this.errorLog = [];
    this.maxLogSize = 100;
  }

  // ✅ Log Error
  logError(error, context = {}) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      message: error.message || String(error),
      stack: error.stack,
      context,
      type: error.name || 'Error'
    };

    this.errorLog.push(errorEntry);

    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    console.error('🔴 Error logged:', errorEntry);

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(errorEntry);
      } catch (e) {
        console.error('Error in error listener:', e);
      }
    });

    return errorEntry;
  }

  // ✅ Subscribe to errors
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ✅ Get recent errors
  getRecentErrors(count = 10) {
    return this.errorLog.slice(-count);
  }

  // ✅ Clear log
  clearLog() {
    this.errorLog = [];
  }

  // ✅ Handle specific error types
  handleNetworkError(error, retry) {
    this.logError(error, { type: 'network', retry });
    
    return {
      title: 'Netzwerkfehler',
      message: 'Bitte überprüfe deine Internetverbindung',
      action: retry ? 'Erneut versuchen' : null
    };
  }

  handleAuthError(error) {
    this.logError(error, { type: 'auth' });
    
    return {
      title: 'Authentifizierung fehlgeschlagen',
      message: 'Bitte melde dich erneut an',
      action: 'Anmelden'
    };
  }

  handleValidationError(error, fields = []) {
    this.logError(error, { type: 'validation', fields });
    
    return {
      title: 'Eingabefehler',
      message: error.message || 'Bitte überprüfe deine Eingaben',
      fields
    };
  }

  handleServerError(error) {
    this.logError(error, { type: 'server' });
    
    return {
      title: 'Serverfehler',
      message: 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.'
    };
  }

  // ✅ Parse error to user-friendly message
  parseError(error) {
    const message = error?.message || String(error);

    // Network errors
    if (message.includes('fetch') || message.includes('network')) {
      return this.handleNetworkError(error);
    }

    // Auth errors
    if (message.includes('401') || message.includes('auth') || message.includes('login')) {
      return this.handleAuthError(error);
    }

    // Validation errors
    if (message.includes('validation') || message.includes('invalid')) {
      return this.handleValidationError(error);
    }

    // Server errors
    if (message.includes('500') || message.includes('server')) {
      return this.handleServerError(error);
    }

    // Default
    return {
      title: 'Fehler',
      message: message || 'Ein unbekannter Fehler ist aufgetreten'
    };
  }

  // ✅ Get error stats
  getStats() {
    const typeCount = {};
    
    this.errorLog.forEach(error => {
      const type = error.context?.type || error.type || 'unknown';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    return {
      totalErrors: this.errorLog.length,
      byType: typeCount,
      recentErrors: this.getRecentErrors(5)
    };
  }
}

export const errorHandler = new ErrorHandler();

// ✅ Setup global error handling
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
    
    const error = event.reason;
    if (error && !error.message?.includes('reason.stack')) {
      errorHandler.logError(error, { source: 'unhandledRejection' });
    }
  });

  window.addEventListener('error', (event) => {
    event.preventDefault();
    
    const error = event.error;
    if (error && !error.message?.includes('reason.stack')) {
      errorHandler.logError(error, { source: 'windowError' });
    }
  });
}

export default errorHandler;