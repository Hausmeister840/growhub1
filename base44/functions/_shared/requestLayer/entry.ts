// ✅ P2.3 EINHEITLICHER REQUEST-LAYER: Centralized request handling with caching, retry, and rate limiting

const REQUEST_CACHE = new Map();
const RATE_LIMIT_STORE = new Map();
const INFLIGHT_REQUESTS = new Map();

// Cache TTL configurations by endpoint type
const CACHE_CONFIGS = {
  'user-profile': 5 * 60 * 1000,    // 5 minutes
  'post-feed': 30 * 1000,           // 30 seconds  
  'search-results': 2 * 60 * 1000,  // 2 minutes
  'static-data': 30 * 60 * 1000,    // 30 minutes (strains, clubs, etc.)
  'real-time': 0                     // No cache (messages, notifications)
};

function successResponse(data, message = 'Success', cached = false) {
  return Response.json({
    ok: true,
    message,
    data,
    meta: { 
      timestamp: new Date().toISOString(),
      cached
    }
  });
}

function errorResponse(message, status = 400, details = null) {
  return Response.json({
    ok: false,
    message,
    details,
    meta: { timestamp: new Date().toISOString() }
  }, { status });
}

// ✅ P2.3: ETag-based caching
function getCacheKey(endpoint, params) {
  const paramsStr = params ? JSON.stringify(params) : '';
  return `${endpoint}:${btoa(paramsStr)}`;
}

function isValidCacheEntry(entry, ttl) {
  if (!entry || !entry.timestamp) return false;
  return Date.now() - entry.timestamp < ttl;
}

// ✅ P2.3: Rate limiting per user/endpoint
function checkRateLimit(userId, endpoint, limit = 10, windowMs = 60000) {
  const key = `${userId}:${endpoint}`;
  const now = Date.now();
  
  if (!RATE_LIMIT_STORE.has(key)) {
    RATE_LIMIT_STORE.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  
  const entry = RATE_LIMIT_STORE.get(key);
  
  if (now > entry.resetTime) {
    RATE_LIMIT_STORE.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  
  if (entry.count >= limit) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetTime: entry.resetTime 
    };
  }
  
  entry.count++;
  return { allowed: true, remaining: limit - entry.count };
}

// ✅ P2.3: Retry with exponential backoff
async function withRetry(operation, maxAttempts = 3, baseDelay = 200) {
  let lastError;
  let delay = baseDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry client errors (4xx) or last attempt
      if (error.status < 500 || attempt === maxAttempts) {
        break;
      }

      // Wait before retry with jitter
      await new Promise(resolve => setTimeout(resolve, delay + Math.random() * 100));
      delay *= 2; // Exponential backoff
    }
  }

  throw lastError;
}

// ✅ P2.3: Main request handler with all features
export async function handleRequest(req, endpoint, operation, options = {}) {
  const {
    cacheType = 'real-time',
    rateLimit = { limit: 10, window: 60000 },
    retryConfig = { attempts: 3, baseDelay: 200 },
    requireAuth = true
  } = options;

  try {
    const { createClientFromRequest } = await import('npm:@base44/sdk@0.7.1');
    const base44 = createClientFromRequest(req);
    let user = null;

    // Authentication check
    if (requireAuth) {
      try {
        user = await base44.auth.me();
        if (!user) {
          return errorResponse('Authentication required', 401);
        }
      } catch (error) {
        return errorResponse('Authentication failed', 401);
      }
    }

    // Rate limiting
    if (user && rateLimit) {
      const rateLimitResult = checkRateLimit(
        user.email, 
        endpoint, 
        rateLimit.limit, 
        rateLimit.window
      );
      
      if (!rateLimitResult.allowed) {
        return errorResponse('Rate limit exceeded', 429, {
          resetTime: rateLimitResult.resetTime,
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        });
      }
    }

    // Request deduplication
    const requestBody = req.method === 'POST' ? await req.json() : {};
    const cacheKey = getCacheKey(endpoint, requestBody);
    
    // Check if same request is already in flight
    if (INFLIGHT_REQUESTS.has(cacheKey)) {
      return await INFLIGHT_REQUESTS.get(cacheKey);
    }

    // Cache check
    const cacheTtl = CACHE_CONFIGS[cacheType] || 0;
    if (cacheTtl > 0) {
      const cached = REQUEST_CACHE.get(cacheKey);
      if (cached && isValidCacheEntry(cached, cacheTtl)) {
        return successResponse(cached.data, 'Success', true);
      }
    }

    // Execute operation with retry and deduplication
    const requestPromise = withRetry(
      () => operation(base44, user, requestBody),
      retryConfig.attempts,
      retryConfig.baseDelay
    );
    
    INFLIGHT_REQUESTS.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      
      // Cache successful result
      if (cacheTtl > 0 && result) {
        REQUEST_CACHE.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
      }

      return successResponse(result);
    } finally {
      INFLIGHT_REQUESTS.delete(cacheKey);
    }

  } catch (error) {
    console.error(`❌ Request failed [${endpoint}]:`, error);
    return errorResponse(`Request failed: ${error.message}`, 500);
  }
}

// Cleanup old cache entries periodically
setInterval(() => {
  const now = Date.now();
  
  // Clean cache
  for (const [key, entry] of REQUEST_CACHE.entries()) {
    if (now - entry.timestamp > 30 * 60 * 1000) { // 30 minutes
      REQUEST_CACHE.delete(key);
    }
  }
  
  // Clean rate limits
  for (const [key, entry] of RATE_LIMIT_STORE.entries()) {
    if (now > entry.resetTime) {
      RATE_LIMIT_STORE.delete(key);
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes