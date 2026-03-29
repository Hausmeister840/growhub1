import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * 🛡️ ROBUST FUNCTION WRAPPER
 * Wrapper für alle Backend-Funktionen
 */

export function robustWrapper(handler, options = {}) {
  const {
    requireAuth = false,
    requireAdmin = false,
    validateInput = null,
    functionName = 'Unknown Function'
  } = options;

  return async (req) => {
    const startTime = Date.now();
    let base44;
    let user = null;

    try {
      base44 = createClientFromRequest(req);

      if (requireAuth || requireAdmin) {
        try {
          user = await base44.auth.me();
          
          if (!user || !user.id) {
            return Response.json(
              { 
                ok: false, 
                error: 'Authentication required',
                message: 'Bitte melde dich an' 
              },
              { status: 401 }
            );
          }

          if (requireAdmin && user.role !== 'admin') {
            return Response.json(
              { 
                ok: false, 
                error: 'Admin access required',
                message: 'Keine Berechtigung' 
              },
              { status: 403 }
            );
          }
        } catch (authError) {
          console.error(`[${functionName}] Auth error:`, authError);
          return Response.json(
            { 
              ok: false, 
              error: 'Authentication failed',
              message: 'Authentifizierung fehlgeschlagen' 
            },
            { status: 401 }
          );
        }
      }

      let payload = {};
      if (req.method === 'POST' || req.method === 'PUT') {
        try {
          const contentType = req.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            payload = await req.json();
          }
        } catch (parseError) {
          return Response.json(
            { 
              ok: false, 
              error: 'Invalid JSON',
              message: 'Ungültige Anfrage' 
            },
            { status: 400 }
          );
        }

        if (validateInput && typeof validateInput === 'function') {
          const validationError = validateInput(payload);
          if (validationError) {
            return Response.json(
              { 
                ok: false, 
                error: 'Validation failed',
                message: validationError,
                details: validationError
              },
              { status: 400 }
            );
          }
        }
      }

      console.log(`[${functionName}] Executing... User: ${user?.email || 'Anonymous'}`);
      
      const result = await handler({
        req,
        base44,
        user,
        payload
      });

      const duration = Date.now() - startTime;
      console.log(`[${functionName}] Success in ${duration}ms`);

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[${functionName}] Error after ${duration}ms:`, error);

      const errorResponse = {
        ok: false,
        error: error.message || 'Internal server error',
        message: 'Ein Fehler ist aufgetreten',
        functionName,
        timestamp: new Date().toISOString()
      };

      if (Deno.env.get('ENVIRONMENT') === 'development') {
        errorResponse.stack = error.stack;
      }

      return Response.json(errorResponse, { status: 500 });
    }
  };
}