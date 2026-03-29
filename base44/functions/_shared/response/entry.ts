export function successResponse(data = null, message = 'Success') {
  return Response.json({
    ok: true,
    message,
    data
  });
}

export function errorResponse(code, message, details = null, status = 400) {
  return Response.json({
    ok: false,
    code,
    message,
    details
  }, { status });
}

export function authError() {
  return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401);
}

export function notFoundError(resource = 'Resource') {
  return errorResponse('NOT_FOUND', `${resource} not found`, null, 404);
}

export function serverError(message = 'Internal server error') {
  return errorResponse('SERVER_ERROR', message, null, 500);
}

Deno.serve((req) => {
  return Response.json({ message: 'Response utilities loaded' });
});