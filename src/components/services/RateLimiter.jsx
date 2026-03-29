/**
 * ⏱️ RATE LIMITER
 * Prevents too many API calls and helps with error recovery
 */

class RateLimiterService {
  constructor() {
    this.requestLog = new Map(); // endpoint -> timestamps[]
    this.blockedEndpoints = new Map(); // endpoint -> unblock time
    this.limits = {
      '/Post': { maxRequests: 10, window: 60000 }, // 10 requests per minute
      '/User': { maxRequests: 20, window: 60000 },
      '/Comment': { maxRequests: 15, window: 60000 },
      '/Message': { maxRequests: 30, window: 60000 },
      default: { maxRequests: 30, window: 60000 }
    };
  }

  // ✅ Check if request can be made
  canMakeRequest(endpoint) {
    const now = Date.now();

    // Check if endpoint is blocked
    const blockedUntil = this.blockedEndpoints.get(endpoint);
    if (blockedUntil && now < blockedUntil) {
      const remainingMs = blockedUntil - now;
      console.warn(`⏱️ Endpoint ${endpoint} is rate-limited for ${Math.ceil(remainingMs / 1000)}s`);
      return false;
    }

    // Get rate limit config
    const config = this.limits[endpoint] || this.limits.default;
    
    // Get request timestamps for this endpoint
    let timestamps = this.requestLog.get(endpoint) || [];
    
    // Remove old timestamps outside the window
    timestamps = timestamps.filter(ts => now - ts < config.window);
    
    // Check if under limit
    if (timestamps.length >= config.maxRequests) {
      // Block for the remaining window time
      const oldestTimestamp = timestamps[0];
      const unblockTime = oldestTimestamp + config.window;
      this.blockedEndpoints.set(endpoint, unblockTime);
      
      console.warn(`⏱️ Rate limit reached for ${endpoint}. Blocked until ${new Date(unblockTime).toLocaleTimeString()}`);
      return false;
    }

    return true;
  }

  // ✅ Record a request
  recordRequest(endpoint) {
    const now = Date.now();
    const timestamps = this.requestLog.get(endpoint) || [];
    timestamps.push(now);
    this.requestLog.set(endpoint, timestamps);

    // Cleanup old timestamps
    this._cleanupOldTimestamps();
  }

  // ✅ Wait for available slot
  async waitForSlot(endpoint, maxWaitMs = 5000) {
    const startTime = Date.now();
    
    while (!this.canMakeRequest(endpoint)) {
      if (Date.now() - startTime > maxWaitMs) {
        throw new Error(`Rate limit timeout for ${endpoint}`);
      }
      
      // Wait 100ms before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.recordRequest(endpoint);
  }

  // ✅ Reset limits for endpoint
  reset(endpoint) {
    this.requestLog.delete(endpoint);
    this.blockedEndpoints.delete(endpoint);
    console.log(`🔄 Rate limiter reset for ${endpoint}`);
  }

  // ✅ Reset all limits
  resetAll() {
    this.requestLog.clear();
    this.blockedEndpoints.clear();
    console.log('🔄 All rate limits reset');
  }

  // ✅ Cleanup old timestamps
  _cleanupOldTimestamps() {
    const now = Date.now();
    const maxWindow = Math.max(...Object.values(this.limits).map(l => l.window));
    
    for (const [endpoint, timestamps] of this.requestLog.entries()) {
      const filtered = timestamps.filter(ts => now - ts < maxWindow * 2);
      if (filtered.length === 0) {
        this.requestLog.delete(endpoint);
      } else {
        this.requestLog.set(endpoint, filtered);
      }
    }
  }

  // ✅ Get status for debugging
  getStatus() {
    const status = {};
    
    for (const [endpoint, timestamps] of this.requestLog.entries()) {
      const config = this.limits[endpoint] || this.limits.default;
      const now = Date.now();
      const recentTimestamps = timestamps.filter(ts => now - ts < config.window);
      
      status[endpoint] = {
        requests: recentTimestamps.length,
        limit: config.maxRequests,
        window: config.window,
        blocked: this.blockedEndpoints.has(endpoint)
      };
    }
    
    return status;
  }
}

// Export singleton
export const rateLimiter = new RateLimiterService();