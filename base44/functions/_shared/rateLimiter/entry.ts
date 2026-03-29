/**
 * 🛡️ RATE LIMITER
 * Schützt vor API-Missbrauch
 */

class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.cleanup();
  }

  /**
   * Check if request is within rate limit
   */
  checkLimit(identifier, config = {}) {
    const {
      maxRequests = 60,
      windowMs = 60000, // 1 minute
      keyPrefix = 'global'
    } = config;

    const key = `${keyPrefix}:${identifier}`;
    const now = Date.now();

    // Get existing requests
    let userRequests = this.requests.get(key) || [];
    
    // Remove expired requests
    userRequests = userRequests.filter(timestamp => 
      now - timestamp < windowMs
    );

    // Check limit
    if (userRequests.length >= maxRequests) {
      const oldestRequest = Math.min(...userRequests);
      const retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000);
      
      return {
        allowed: false,
        remaining: 0,
        retryAfter
      };
    }

    // Add current request
    userRequests.push(now);
    this.requests.set(key, userRequests);

    return {
      allowed: true,
      remaining: maxRequests - userRequests.length,
      retryAfter: 0
    };
  }

  /**
   * Cleanup old entries
   */
  cleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, timestamps] of this.requests.entries()) {
        const valid = timestamps.filter(t => now - t < 3600000); // 1 hour
        if (valid.length === 0) {
          this.requests.delete(key);
        } else {
          this.requests.set(key, valid);
        }
      }
    }, 300000); // Cleanup every 5 minutes
  }

  /**
   * Clear limits for identifier
   */
  clear(identifier, keyPrefix = 'global') {
    const key = `${keyPrefix}:${identifier}`;
    this.requests.delete(key);
  }

  /**
   * Get current usage
   */
  getUsage(identifier, keyPrefix = 'global') {
    const key = `${keyPrefix}:${identifier}`;
    const requests = this.requests.get(key) || [];
    return requests.length;
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

/**
 * Rate limit configs for different endpoints
 */
export const RATE_LIMITS = {
  // Strict limits
  auth: { maxRequests: 5, windowMs: 300000 }, // 5 per 5 minutes
  registration: { maxRequests: 3, windowMs: 3600000 }, // 3 per hour
  ai: { maxRequests: 15, windowMs: 3600000 }, // 15 per hour
  spotSubmit: { maxRequests: 10, windowMs: 3600000 }, // 10 per hour
  createPost: { maxRequests: 10, windowMs: 60000 }, // 10 per minute
  createComment: { maxRequests: 30, windowMs: 60000 }, // 30 per minute
  
  // Moderate limits
  reaction: { maxRequests: 100, windowMs: 60000 }, // 100 per minute
  follow: { maxRequests: 50, windowMs: 60000 }, // 50 per minute
  
  // Lenient limits
  read: { maxRequests: 300, windowMs: 60000 }, // 300 per minute
  search: { maxRequests: 60, windowMs: 60000 }, // 60 per minute
};

/**
 * Middleware wrapper for rate limiting
 */
export async function withRateLimit(identifier, handler, config) {
  const result = rateLimiter.checkLimit(identifier, config);

  if (!result.allowed) {
    return Response.json({
      error: 'Rate limit exceeded',
      message: `Zu viele Anfragen. Bitte warte ${result.retryAfter} Sekunden.`,
      retryAfter: result.retryAfter
    }, {
      status: 429,
      headers: {
        'Retry-After': result.retryAfter.toString(),
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': (Date.now() + result.retryAfter * 1000).toString()
      }
    });
  }

  // Add rate limit headers to response
  const response = await handler();
  
  if (response instanceof Response) {
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  }

  return response;
}

export default rateLimiter;