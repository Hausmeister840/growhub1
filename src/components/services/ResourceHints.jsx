/**
 * Resource Hints Service
 * Manages DNS prefetch, preconnect, and preload hints
 */

class ResourceHints {
  constructor() {
    this.hints = new Set();
  }

  /**
   * DNS Prefetch
   */
  dnsPrefetch(domain) {
    if (this.hints.has(`dns-${domain}`)) return;

    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);

    this.hints.add(`dns-${domain}`);
  }

  /**
   * Preconnect
   */
  preconnect(url, crossorigin = false) {
    if (this.hints.has(`preconnect-${url}`)) return;

    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = url;
    if (crossorigin) link.crossOrigin = 'anonymous';
    document.head.appendChild(link);

    this.hints.add(`preconnect-${url}`);
  }

  /**
   * Preload
   */
  preload(url, as, type = null) {
    if (this.hints.has(`preload-${url}`)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = as;
    if (type) link.type = type;
    document.head.appendChild(link);

    this.hints.add(`preload-${url}`);
  }

  /**
   * Prefetch
   */
  prefetch(url) {
    if (this.hints.has(`prefetch-${url}`)) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);

    this.hints.add(`prefetch-${url}`);
  }

  /**
   * Setup common hints
   */
  setupCommonHints() {
    // Preconnect to common domains
    this.preconnect('https://fonts.googleapis.com');
    this.preconnect('https://fonts.gstatic.com', true);
    
    // DNS prefetch for likely domains
    this.dnsPrefetch('//api.growhub.app');
    this.dnsPrefetch('//cdn.growhub.app');
  }

  /**
   * Clear hints
   */
  clear() {
    this.hints.clear();
  }
}

export default new ResourceHints();