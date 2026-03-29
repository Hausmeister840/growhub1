/**
 * 🛡️ RATE LIMITING MIDDLEWARE
 * Wrapper für Backend-Funktionen
 */

// Inline Rate Limiter (statt separater Import)
const store = new Map();

function createRateLimiter({ 
  maxRequests = 10, 
  windowMs = 60000,
  blockDurationMs = 300000
}) {
  
  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of store.entries()) {
      if (now - data.resetTime > windowMs) {
        store.delete(key);
      }
    }
  }, 60000);

  return {
    check(identifier) {
      const now = Date.now();
      const data = store.get(identifier) || { 
        count: 0, 
        resetTime: now + windowMs,
        blocked: false,
        blockUntil: null
      };

      if (data.blocked && now < data.blockUntil) {
        throw new Error(`Rate limit exceeded. Try again in ${Math.ceil((data.blockUntil - now) / 1000)}s`);
      }

      if (now > data.resetTime) {
        data.count = 0;
        data.resetTime = now + windowMs;
        data.blocked = false;
        data.blockUntil = null;
      }

      data.count++;

      if (data.count > maxRequests) {
        data.blocked = true;
        data.blockUntil = now + blockDurationMs;
        store.set(identifier, data);
        throw new Error(`Rate limit exceeded. Blocked for ${blockDurationMs / 1000}s`);
      }

      store.set(identifier, data);

      return {
        allowed: true,
        remaining: maxRequests - data.count,
        resetTime: data.resetTime
      };
    }
  };
}

const limiters = {
  strict: createRateLimiter({ maxRequests: 5, windowMs: 60000 }),
  standard: createRateLimiter({ maxRequests: 20, windowMs: 60000 }),
  relaxed: createRateLimiter({ maxRequests: 100, windowMs: 60000 })
};

export function withRateLimit(handler, limitType = 'standard') {
  return async (req) => {
    try {
      // Get user identifier (IP or user email)
      const forwarded = req.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
      
      // Try to get user from request
      let identifier = ip;
      try {
        const { createClientFromRequest } = await import('npm:@base44/sdk@0.7.1');
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (user) identifier = user.email;
      } catch {
        // User not authenticated, use IP
      }

      // Check rate limit
      const limiter = limiters[limitType] || limiters.standard;
      const result = limiter.check(identifier);

      // Add rate limit headers
      const response = await handler(req);
      
      if (response instanceof Response) {
        response.headers.set('X-RateLimit-Limit', '20');
        response.headers.set('X-RateLimit-Remaining', String(result.remaining));
        response.headers.set('X-RateLimit-Reset', String(result.resetTime));
        return response;
      }

      return response;

    } catch (error) {
      if (error.message.includes('Rate limit exceeded')) {
        return Response.json({
          error: 'rate_limit_exceeded',
          message: error.message
        }, { 
          status: 429,
          headers: {
            'Retry-After': '60'
          }
        });
      }
      throw error;
    }
  };
}

// Export pre-configured wrappers
export const withStrictRateLimit = (handler) => withRateLimit(handler, 'strict');
export const withStandardRateLimit = (handler) => withRateLimit(handler, 'standard');
export const withRelaxedRateLimit = (handler) => withRateLimit(handler, 'relaxed');