import { secureWrapper } from '../../_shared/secureWrapper.js';
import { RATE_LIMITS } from '../../_shared/rateLimiter.js';

Deno.serve(secureWrapper(async (req, { base44, user, body }) => {
  try {
    const { prompt, file_urls, context_options } = body || {};

    if (!prompt || typeof prompt !== 'string') {
      return Response.json({ 
        success: false, 
        error: 'Prompt erforderlich' 
      }, { status: 400 });
    }

    // Build context
    let contextInfo = '';
    
    if (context_options?.include_diaries) {
      try {
        const diaries = await base44.entities.GrowDiary.filter({ 
          created_by: user.email 
        }, '-updated_date', 5);
        
        if (diaries && diaries.length > 0) {
          contextInfo += '\n\n**Grow-Tagebücher des Nutzers:**\n';
          diaries.forEach(d => {
            contextInfo += `- ${d.name} (${d.strain_name}) - Phase: ${d.current_stage}, Tag ${d.stats?.total_days || 0}\n`;
          });
        }
      } catch (err) {
        console.warn('Failed to load diaries:', err);
      }
    }

    // Create AI prompt
    const fullPrompt = `Du bist der **Grow Master**, ein freundlicher Cannabis-Anbau-Experte.

Beantworte die folgende Frage ausführlich und hilfreich:

${prompt}

${contextInfo}

**Wichtig:**
- Gib konkrete, praktische Ratschläge
- Erkläre Fachbegriffe wenn nötig
- Sei freundlich und ermutigend
- Nutze Emojis wo passend (🌱💧☀️)
- Strukturiere deine Antwort mit Markdown (Listen, Bold, etc.)`;

    // Call AI
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: fullPrompt,
      file_urls: file_urls || undefined,
      add_context_from_internet: false
    });

    return Response.json({
      success: true,
      response: response,
      metadata: {
        context_used: context_options?.include_diaries ? 'Grow-Tagebücher' : 'Allgemein',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Grow Master error:', error);
    return Response.json({ 
      success: false,
      error: error.message || 'Fehler bei der KI-Anfrage' 
    }, { status: 500 });
  }
}, {
  requireAuth: true,
  rateLimit: RATE_LIMITS.ai,
  maxBodySizeKB: 256
}));