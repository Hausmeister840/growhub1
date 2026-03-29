// ✅ Global error suppressor - runs immediately
(function() {
  if (typeof window === 'undefined') return;

  const suppressedPatterns = [
    /WebSocket/i,
    /ResizeObserver/i,
    /Failed to fetch/i,
    /Network Error/i,
    /socket/i
  ];

  const shouldSuppress = (message) => {
    const str = String(message);
    return suppressedPatterns.some(pattern => pattern.test(str));
  };

  // Override console methods
  const originalError = window.console.error;
  const originalWarn = window.console.warn;

  window.console.error = function(...args) {
    if (!shouldSuppress(args.join(' '))) {
      originalError.apply(console, args);
    }
  };

  window.console.warn = function(...args) {
    if (!shouldSuppress(args.join(' '))) {
      originalWarn.apply(console, args);
    }
  };

  // Suppress unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (shouldSuppress(String(event.reason))) {
      event.preventDefault();
    }
  });

  // Suppress global errors
  window.addEventListener('error', (event) => {
    if (shouldSuppress(event.message)) {
      event.preventDefault();
      return true;
    }
  });
})();

export default {};