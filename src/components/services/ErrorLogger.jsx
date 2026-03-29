// Central Error Logging Service

class ErrorLogger {
  constructor() {
    this.errors = [];
    this.maxErrors = 100;
  }

  log(error, context = '') {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      message: error?.message || String(error),
      stack: error?.stack || '',
      context,
      userAgent: navigator?.userAgent || '',
      url: window?.location?.href || ''
    };

    this.errors.unshift(errorEntry);
    
    // Keep only last 100 errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${context}]`, error);
    }

    // Store in localStorage for debugging
    try {
      localStorage.setItem('app_errors', JSON.stringify(this.errors.slice(0, 10)));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  getErrors() {
    return this.errors;
  }

  clearErrors() {
    this.errors = [];
    try {
      localStorage.removeItem('app_errors');
    } catch (e) {
      // Ignore
    }
  }
}

export const errorLogger = new ErrorLogger();