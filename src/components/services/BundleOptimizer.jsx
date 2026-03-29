/**
 * Bundle Optimizer
 * Dynamic imports and code splitting helpers
 */

class BundleOptimizer {
  constructor() {
    this.loadedModules = new Map();
    this.pendingImports = new Map();
  }

  /**
   * Dynamic import with caching
   */
  async import(modulePath) {
    // Return cached module
    if (this.loadedModules.has(modulePath)) {
      return this.loadedModules.get(modulePath);
    }

    // Return pending import
    if (this.pendingImports.has(modulePath)) {
      return this.pendingImports.get(modulePath);
    }

    // Start new import
    const importPromise = import(modulePath)
      .then(module => {
        this.loadedModules.set(modulePath, module);
        this.pendingImports.delete(modulePath);
        return module;
      })
      .catch(error => {
        this.pendingImports.delete(modulePath);
        throw error;
      });

    this.pendingImports.set(modulePath, importPromise);
    return importPromise;
  }

  /**
   * Preload module
   */
  preload(modulePath) {
    if (this.loadedModules.has(modulePath)) return;
    if (this.pendingImports.has(modulePath)) return;

    // Use link prefetch
    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = modulePath;
    document.head.appendChild(link);
  }

  /**
   * Prefetch module (low priority)
   */
  prefetch(modulePath) {
    if (this.loadedModules.has(modulePath)) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = modulePath;
    document.head.appendChild(link);
  }

  /**
   * Get bundle size estimate
   */
  getBundleSize() {
    if (!performance || !performance.getEntriesByType) return 0;

    const resources = performance.getEntriesByType('resource');
    const scripts = resources.filter(r => r.initiatorType === 'script');
    
    return scripts.reduce((total, script) => total + (script.transferSize || 0), 0);
  }

  /**
   * Clear cache
   */
  clear() {
    this.loadedModules.clear();
    this.pendingImports.clear();
  }
}

export default new BundleOptimizer();