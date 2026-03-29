import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    // ✅ CORS HEADERS für Preflight-Requests
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const base44 = createClientFromRequest(req);
    
    let requestData;
    try {
      requestData = await req.json();
    } catch (jsonError) {
      return Response.json({ 
        available: false, 
        message: 'Ungültige Anfrage-Daten'
      }, { status: 400 });
    }

    const { username } = requestData;

    // ✅ DETAILLIERTE VALIDIERUNG
    if (!username) {
      return Response.json({ 
        available: false, 
        message: 'Username ist erforderlich' 
      });
    }

    if (typeof username !== 'string') {
      return Response.json({ 
        available: false, 
        message: 'Username muss ein Text sein' 
      });
    }

    if (username.length < 3) {
      return Response.json({ 
        available: false, 
        message: 'Username muss mindestens 3 Zeichen haben' 
      });
    }

    if (username.length > 20) {
      return Response.json({ 
        available: false, 
        message: 'Username darf maximal 20 Zeichen haben' 
      });
    }

    const handleRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!handleRegex.test(username)) {
      return Response.json({ 
        available: false, 
        message: 'Username darf nur Buchstaben, Zahlen und Unterstriche enthalten' 
      });
    }

    // ✅ RESERVIERTE USERNAMES
    const reservedNames = [
      'admin', 'root', 'user', 'growhub', 'api', 'www', 'mail', 'support',
      'help', 'info', 'contact', 'about', 'terms', 'privacy', 'legal',
      'moderator', 'mod', 'staff', 'team'
    ];

    if (reservedNames.includes(username.toLowerCase())) {
      return Response.json({ 
        available: false, 
        message: 'Dieser Username ist reserviert' 
      });
    }

    // ✅ DATENBANK-ABFRAGE mit Fehlerbehandlung
    try {
      const users = await base44.asServiceRole.entities.User.filter({ 
        username: username.toLowerCase() 
      });

      if (users.length > 0) {
        return Response.json({ 
          available: false, 
          message: 'Username ist bereits vergeben' 
        });
      }

      return Response.json({ 
        available: true,
        message: 'Username ist verfügbar' 
      });

    } catch (dbError) {
      console.error('Database error in checkUsername:', dbError);
      return Response.json({ 
        available: false, 
        message: 'Fehler bei der Username-Prüfung. Versuche es erneut.' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('checkUsername function error:', error);
    return Response.json({ 
        available: false, 
        message: 'Server-Fehler. Versuche es erneut.' 
    }, { status: 500 });
  }
});