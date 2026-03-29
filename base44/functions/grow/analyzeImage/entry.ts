import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { image_url, context } = await req.json();

    if (!image_url) {
      return Response.json({ error: 'image_url required' }, { status: 400 });
    }

    const prompt = `Du bist ein Cannabis-Anbau-Experte. Analysiere dieses Pflanzenfoto im Detail.

Kontext:
- Sorte: ${context?.strain || 'Unbekannt'}
- Phase: ${context?.stage || 'Unbekannt'}
- Tag: ${context?.day || 'Unbekannt'}

Analysiere folgendes:
1. Allgemeiner Gesundheitszustand (excellent/good/fair/poor/critical)
2. Erkennbare Probleme (Nährstoffmängel, Schädlinge, Krankheiten, Stress)
3. Positive Merkmale (kräftiges Wachstum, gesunde Farbe, gute Struktur)
4. Konkrete Handlungsempfehlungen mit Priorität
5. Detaillierte Beschreibung der Beobachtungen

Gib eine ehrliche, hilfreiche Analyse.`;

    // ✅ Nutze das Base44 SDK, um die Integration aufzurufen
    const analysisResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [image_url],
      response_json_schema: {
        type: 'object',
        properties: {
          health_assessment: {
            type: 'string',
            enum: ['excellent', 'good', 'fair', 'poor', 'critical']
          },
          confidence_score: {
            type: 'number',
            minimum: 0,
            maximum: 1
          },
          detected_issues: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                issue_type: { type: 'string' },
                severity: {
                  type: 'string',
                  enum: ['low', 'medium', 'high', 'critical']
                },
                description: { type: 'string' },
                recommendation: { type: 'string' }
              }
            }
          },
          positive_observations: {
            type: 'array',
            items: { type: 'string' }
          },
          action_items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                action: { type: 'string' },
                priority: {
                  type: 'string',
                  enum: ['immediate', 'urgent', 'soon', 'routine']
                },
                timeframe: { type: 'string' }
              }
            }
          },
          detailed_analysis: { type: 'string' }
        }
      }
    });

    return Response.json({
      success: true,
      analysis: {
        ...analysisResult,
        analyzed_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return Response.json({ 
      error: 'Analysis failed',
      details: error.message 
    }, { status: 500 });
  }
});