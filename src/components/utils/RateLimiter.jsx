/**
 * 🚦 RATE LIMITER - Verhindert Spam
 */

class RateLimiter {
  constructor() {
    this.requests = new Map();
  }

  canMakeRequest(key, maxRequests = 5, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing requests for this key
    let requestTimes = this.requests.get(key) || [];

    // Remove old requests outside the time window
    requestTimes = requestTimes.filter(time => time > windowStart);

    // Check if we're under the limit
    if (requestTimes.length >= maxRequests) {
      return false;
    }

    // Add new request
    requestTimes.push(now);
    this.requests.set(key, requestTimes);

    return true;
  }

  reset(key) {
    this.requests.delete(key);
  }

  clearAll() {
    this.requests.clear();
  }
}

export const rateLimiter = new RateLimiter();
export default rateLimiter;