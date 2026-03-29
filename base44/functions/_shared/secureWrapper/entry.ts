import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { withRateLimit, RATE_LIMITS } from '../_shared/rateLimiter.js';

/**
 * 🔒 SECURE WRAPPER
 * Wraps functions with security checks
 */

/**
 * Validates request origin
 */
function validateOrigin(req) {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  
  if (!origin && !referer) {
    return false;
  }

  const allowedOrigins = [
    'https://growhub.base44.com',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ];

  return allowedOrigins.some(allowed => 
    origin?.startsWith(allowed) || referer?.startsWith(allowed)
  );
}

/**
 * Validates request body size
 */
function validateBodySize(body, maxSizeKB = 1024) {
  const bodyStr = JSON.stringify(body);
  const sizeKB = new Blob([bodyStr]).size / 1024;
  
  if (sizeKB > maxSizeKB) {
    throw new Error(`Request body too large: ${sizeKB.toFixed(2)}KB (max: ${maxSizeKB}KB)`);
  }
}

/**
 * Sanitizes input
 */
function sanitizeInput(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeInput(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Logs security event
 */
async function logSecurityEvent(base44, event) {
  try {
    await base44.asServiceRole.entities.AppEvent.create({
      user_email: event.user_email || 'system',
      type: 'security_event',
      data: event,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

/**
 * Secure wrapper for backend functions
 */
export function secureWrapper(handler, options = {}) {
  const {
    requireAuth = true,
    requireAdmin = false,
    requireRoles = null,
    rateLimit = RATE_LIMITS.read,
    maxBodySizeKB = 1024,
    validateOriginHeader = false,
    sanitizeInputs = true
  } = options;

  return async (req) => {
    try {
      const base44 = createClientFromRequest(req);

      // ✅ 1. Validate origin
      if (validateOriginHeader && !validateOrigin(req)) {
        console.warn('🚫 Invalid origin:', req.headers.get('origin'));
        return Response.json({
          error: 'Invalid origin',
          message: 'Request blocked for security reasons'
        }, { status: 403 });
      }

      // ✅ 2. Check authentication
      let user = null;
      if (requireAuth) {
        try {
          user = await base44.auth.me();
          if (!user) {
            return Response.json({
              error: 'Unauthorized',
              message: 'Authentication required'
            }, { status: 401 });
          }
        } catch (error) {
          return Response.json({
            error: 'Unauthorized',
            message: 'Invalid or expired token'
          }, { status: 401 });
        }
      }

      // ✅ 3. Check admin
      const allowedRoles = Array.isArray(requireRoles) && requireRoles.length > 0
        ? requireRoles
        : (requireAdmin ? ['admin'] : null);

      if (allowedRoles && !allowedRoles.includes(user?.role)) {
        await logSecurityEvent(base44, {
          type: 'unauthorized_admin_access',
          user_email: user?.email,
          endpoint: req.url
        });

        return Response.json({
          error: 'Forbidden',
          message: 'Insufficient permissions'
        }, { status: 403 });
      }

      // ✅ 4. Parse and validate body
      let body = {};
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        try {
          body = await req.json();
          validateBodySize(body, maxBodySizeKB);
          
          if (sanitizeInputs) {
            body = sanitizeInput(body);
          }
        } catch (error) {
          return Response.json({
            error: 'Invalid request',
            message: error.message
          }, { status: 400 });
        }
      }

      // ✅ 5. Rate limiting
      if (rateLimit) {
        const identifier = user?.email || req.headers.get('x-forwarded-for') || 'anonymous';
        
        return await withRateLimit(
          identifier,
          () => handler(req, { base44, user, body }),
          rateLimit
        );
      }

      // ✅ 6. Execute handler
      return await handler(req, { base44, user, body });

    } catch (error) {
      console.error('❌ Secure wrapper error:', error);

      return Response.json({
        error: 'Internal error',
        message: 'Ein Fehler ist aufgetreten'
      }, { status: 500 });
    }
  };
}

export default secureWrapper;