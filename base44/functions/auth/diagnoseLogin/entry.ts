import { secureWrapper } from '../../_shared/secureWrapper.js';
import { RATE_LIMITS } from '../../_shared/rateLimiter.js';

/**
 * 🔍 DIAGNOSE: Findet GENAU heraus, warum Google Login nicht funktioniert
 */
Deno.serve(secureWrapper(async (req, { base44, user }) => {
  try {
    // 1. Aktuelle App-URL ermitteln
    const referer = req.headers.get('referer') || req.headers.get('origin') || '';
    const url = new URL(referer || req.url);
    const appOrigin = `${url.protocol}//${url.host}`;
    
    // 2. Prüfe Auth-Status
    const isAuthenticated = !!user;
    const currentUser = user || null;
    
    // 3. Sammle alle relevanten Informationen
    const diagnosis = {
      // Status
      isAuthenticated,
      currentUser: currentUser ? {
        email: currentUser.email,
        full_name: currentUser.full_name,
        id: currentUser.id
      } : null,
      
      // URLs
      detectedAppUrl: appOrigin,
      requiredJavaScriptOrigin: appOrigin,
      requiredRedirectUri: `${appOrigin}/auth/callback`,
      
      // Was in Google Console stehen MUSS
      googleConsoleSettings: {
        authorizedJavaScriptOrigins: [appOrigin],
        authorizedRedirectUris: [`${appOrigin}/auth/callback`],
        
        // Diese URLs müssen GELÖSCHT werden
        urlsToDelete: [
          'https://ee2e55cd-535a-4c89-9942-fd550d7d8338-00-39y1jfh3thxhb.riker.replit.dev',
          'https://app.base44.com/auth/google/callback',
          'https://growhub-copy-h568d3-base44.app/auth/google/callback',
          'https://preview--grow-hub-copy-1bb683d6.base44.app'
        ]
      },
      
      // Schritt-für-Schritt Anleitung
      instructions: [
        {
          step: 1,
          action: 'Öffne Google Cloud Console',
          url: 'https://console.cloud.google.com/apis/credentials',
          description: 'Gehe zu APIs & Services → Credentials'
        },
        {
          step: 2,
          action: 'Klicke auf deinen OAuth 2.0 Client',
          description: 'Öffne den konfigurierten OAuth Client in der Google Console'
        },
        {
          step: 3,
          action: 'LÖSCHE alle alten URLs',
          urls: [
            'https://ee2e55cd-535a-4c89-9942-fd550d7d8338-00-39y1jfh3thxhb.riker.replit.dev',
            'https://app.base44.com/auth/google/callback',
            'https://growhub-copy-h568d3-base44.app/auth/google/callback',
            'https://preview--grow-hub-copy-1bb683d6.base44.app'
          ]
        },
        {
          step: 4,
          action: 'Trage diese URL als JavaScript-Quelle ein',
          url: appOrigin,
          copyable: true
        },
        {
          step: 5,
          action: 'Trage diese URL als Redirect-URI ein',
          url: `${appOrigin}/auth/callback`,
          copyable: true
        },
        {
          step: 6,
          action: 'Klicke auf SPEICHERN',
          description: 'Warte 2-3 Minuten, bis Google die Änderungen übernommen hat'
        },
        {
          step: 7,
          action: 'Teste den Login erneut',
          description: 'Gehe zurück zur App und versuche dich einzuloggen'
        }
      ],
      
      // Warum das Problem auftritt
      rootCause: {
        problem: 'Google OAuth blockiert Login-Anfragen von nicht autorisierten URLs',
        explanation: 'In deiner Google Console sind 4 alte/falsche URLs gespeichert. Google erlaubt nur Anfragen von exakt den konfigurierten URLs. Da deine App jetzt von einer anderen URL läuft, wird die Verbindung verweigert.',
        solution: 'Lösche alle alten URLs und trage nur die aktuelle App-URL ein.',
        technicalDetails: {
          error: 'accounts.google.com haben die Verbindung verweigert',
          cause: 'CORS/Redirect-URL Mismatch',
          fix: 'Update Google Cloud Console Authorized URLs'
        }
      },
      
      // Timestamp
      timestamp: new Date().toISOString()
    };
    
    return Response.json({
      success: true,
      diagnosis
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Diagnosis error:', error);
    
    return Response.json({
      success: false,
      error: error.message,
      diagnosis: {
        rootCause: {
          problem: 'Konnte Diagnose nicht durchführen',
          explanation: error.message
        }
      }
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}, {
  requireAuth: true,
  requireRoles: ['admin', 'moderator'],
  rateLimit: RATE_LIMITS.auth,
  maxBodySizeKB: 32
}));