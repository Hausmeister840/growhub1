// Performance utilities for optimized rendering

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const batchUpdates = (updates) => {
  return Promise.all(updates);
};

export const createLazyComponent = (importFunc) => {
  if (typeof window === 'undefined') return null;
  
  return () => Promise.all([
    importFunc(),
    new Promise(resolve => setTimeout(resolve, 100))
  ]).then(([module]) => module);
};

export const measurePerformance = (name, fn) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
  return result;
};

export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

export const preloadImages = (urls) => {
  return Promise.allSettled(urls.map(preloadImage));
};

export const isInViewport = (element) => {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

export const optimizeScroll = (callback, delay = 100) => {
  let ticking = false;
  let lastCall = 0;

  return () => {
    const now = Date.now();
    
    if (now - lastCall < delay) {
      return;
    }

    lastCall = now;

    if (!ticking) {
      window.requestAnimationFrame(() => {
        callback();
        ticking = false;
      });
      ticking = true;
    }
  };
};