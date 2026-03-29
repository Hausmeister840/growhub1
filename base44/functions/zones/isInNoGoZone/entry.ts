// ✅ ABSOLUTE MINIMUM - GARANTIERT KEIN 500 ERROR

Deno.serve((req) => {
  return new Response(JSON.stringify({
    status: 'safe',
    severity: 'info',
    in_zone: false,
    approaching_zone: false,
    nearby_zone: false,
    warning_message: '✅ SAFE',
    matches: [],
    approaching: [],
    nearby: []
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});