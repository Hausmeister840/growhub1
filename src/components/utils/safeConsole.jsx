// Safe console wrapper to prevent errors in environments where console methods don't exist
export const safeConsole = {
  log: (...args) => {
    if (typeof console !== 'undefined' && console.log) {
      console.log(...args);
    }
  },
  error: (...args) => {
    if (typeof console !== 'undefined' && console.error) {
      console.error(...args);
    }
  },
  warn: (...args) => {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(...args);
    }
  },
  group: (...args) => {
    if (typeof console !== 'undefined' && console.group) {
      console.group(...args);
    }
  },
  groupEnd: () => {
    if (typeof console !== 'undefined' && console.groupEnd) {
      console.groupEnd();
    }
  }
};