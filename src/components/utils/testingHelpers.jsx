/**
 * 🧪 TESTING HELPERS
 * Utility-Funktionen für Testing
 */

/**
 * Simuliert langsames Netzwerk
 */
export function simulateSlowNetwork(delay = 3000) {
  const originalFetch = window.fetch;
  
  window.fetch = async (...args) => {
    await new Promise(resolve => setTimeout(resolve, delay));
    return originalFetch(...args);
  };

  console.log(`🐌 Simulating slow network (${delay}ms delay)`);
  
  return () => {
    window.fetch = originalFetch;
    console.log('✅ Network simulation stopped');
  };
}

/**
 * Simuliert schlechte Performance
 */
export function simulateLowPerformance() {
  // Force slow rendering
  const style = document.createElement('style');
  style.textContent = `
    * {
      will-change: auto !important;
    }
    img, video {
      image-rendering: pixelated;
    }
  `;
  document.head.appendChild(style);

  console.log('🐌 Simulating low performance');
  
  return () => {
    style.remove();
    console.log('✅ Performance simulation stopped');
  };
}

/**
 * Logs Rendering Performance
 */
export function measureRenderTime(componentName) {
  const start = performance.now();
  
  return () => {
    const end = performance.now();
    const duration = end - start;
    
    console.log(`⏱️ ${componentName} rendered in ${duration.toFixed(2)}ms`);
    
    if (duration > 100) {
      console.warn(`⚠️ Slow render detected for ${componentName}`);
    }
  };
}

/**
 * Memory Usage Logger
 */
export function logMemoryUsage() {
  if (!performance.memory) {
    console.warn('Memory API not available');
    return;
  }

  const memory = performance.memory;
  const used = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
  const total = (memory.totalJSHeapSize / 1024 / 1024).toFixed(2);
  const limit = (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2);

  console.log(`💾 Memory: ${used}MB / ${total}MB (Limit: ${limit}MB)`);
}

/**
 * Creates Performance Test Suite
 */
export function createPerformanceTest(testName) {
  const results = [];
  
  return {
    measure(name, fn) {
      const start = performance.now();
      const result = fn();
      const duration = performance.now() - start;
      
      results.push({ name, duration });
      
      return result;
    },
    
    async measureAsync(name, fn) {
      const start = performance.now();
      const result = await fn();
      const duration = performance.now() - start;
      
      results.push({ name, duration });
      
      return result;
    },
    
    report() {
      console.group(`📊 Performance Test: ${testName}`);
      
      results.forEach(({ name, duration }) => {
        const emoji = duration < 100 ? '⚡' : duration < 500 ? '⏱️' : '🐌';
        console.log(`${emoji} ${name}: ${duration.toFixed(2)}ms`);
      });
      
      const total = results.reduce((sum, r) => sum + r.duration, 0);
      console.log(`📊 Total: ${total.toFixed(2)}ms`);
      
      console.groupEnd();
      
      return results;
    }
  };
}

/**
 * Auto Quality Checker
 */
export function startQualityMonitoring() {
  let frameCount = 0;
  let lastTime = performance.now();
  
  const checkFPS = () => {
    frameCount++;
    const now = performance.now();
    
    if (now >= lastTime + 1000) {
      const fps = Math.round((frameCount * 1000) / (now - lastTime));
      
      if (fps < 30) {
        console.warn(`⚠️ Low FPS detected: ${fps}`);
      } else {
        console.log(`✅ FPS: ${fps}`);
      }
      
      frameCount = 0;
      lastTime = now;
    }
    
    requestAnimationFrame(checkFPS);
  };
  
  requestAnimationFrame(checkFPS);
  console.log('📊 FPS monitoring started');
}