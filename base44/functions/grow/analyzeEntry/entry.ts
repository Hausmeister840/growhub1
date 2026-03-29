import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// ✅ NAMED EXPORT für Platform V2
export async function analyzeEntry(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return {
        ok: false,
        error: 'authentication_required'
      };
    }

    // Body parsen
    let entry_id, force_refresh;
    try {
      const body = await req.json();
      entry_id = body.entry_id;
      force_refresh = body.force_refresh || false;
    } catch (e) {
      return {
        ok: false,
        error: 'invalid_request'
      };
    }

    if (!entry_id) {
      return {
        ok: false,
        error: 'entry_id_required'
      };
    }

    // Load entry
    const entries = await base44.entities.GrowDiaryEntry.filter({ id: entry_id });
    if (entries.length === 0) {
      return {
        ok: false,
        error: 'entry_not_found'
      };
    }

    const entry = entries[0];

    // Load diary to check access
    const diaries = await base44.entities.GrowDiary.filter({ id: entry.diary_id });
    if (diaries.length === 0) {
      return {
        ok: false,
        error: 'diary_not_found'
      };
    }

    const diary = diaries[0];

    if (diary.created_by !== user.email) {
      return {
        ok: false,
        error: 'access_denied'
      };
    }

    // Check if already analyzed and not forcing refresh
    if (entry.ai_analysis && !force_refresh) {
      return {
        ok: true,
        cached: true,
        analysis: entry.ai_analysis
      };
    }

    // ✅ PERFORM AI ANALYSIS
    const analysis = await performAIAnalysis(entry, diary, base44);

    // Update entry with analysis
    await base44.entities.GrowDiaryEntry.update(entry_id, {
      ai_analysis: analysis
    });

    // Update diary insights
    await updateDiaryInsights(diary, analysis, base44);

    return {
      ok: true,
      cached: false,
      analysis
    };

  } catch (error) {
    console.error('🚨 Analysis error:', error);
    
    return {
      ok: false,
      error: 'analysis_failed',
      message: error.message
    };
  }
}

async function performAIAnalysis(entry, diary, base44) {
  const prompt = buildAnalysisPrompt(entry, diary);

  try {
    const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          health_assessment: {
            type: 'string',
            enum: ['excellent', 'good', 'fair', 'poor', 'critical']
          },
          confidence_score: { type: 'number' },
          detected_issues: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                issue_type: { type: 'string' },
                severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
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
                priority: { type: 'string', enum: ['immediate', 'urgent', 'soon', 'routine'] },
                timeframe: { type: 'string' }
              }
            }
          }
        }
      }
    });

    return {
      ...llmResponse,
      analyzed_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('LLM analysis failed:', error);
    
    // Fallback basic analysis
    return {
      health_assessment: 'good',
      confidence_score: 0.5,
      detected_issues: [],
      positive_observations: ['Eintrag erfolgreich gespeichert'],
      action_items: [],
      analyzed_at: new Date().toISOString(),
      error: 'ai_unavailable'
    };
  }
}

function buildAnalysisPrompt(entry, diary) {
  return `Du bist ein Cannabis-Anbau-Experte. Analysiere den folgenden Grow-Tagebuch-Eintrag:

**Grow Info:**
- Sorte: ${diary.strain_name}
- Setup: ${diary.setup_type}
- Methode: ${diary.grow_method}
- Phase: ${entry.growth_stage}
- Tag: ${entry.day_number}

**Eintrag:**
- Beobachtung: ${entry.plant_observation || 'Keine Angabe'}
- Höhe: ${entry.plant_height_cm || 'Keine Angabe'} cm
- Temperatur: ${entry.environment_data?.temp_c || 'Keine Angabe'}°C
- Luftfeuchtigkeit: ${entry.environment_data?.humidity_rh || 'Keine Angabe'}%
- pH-Wert: ${entry.feeding_data?.ph || 'Keine Angabe'}
- EC/PPM: ${entry.feeding_data?.ec_ppm || 'Keine Angabe'}
- Wasser: ${entry.feeding_data?.water_ml || 'Keine Angabe'} ml

Analysiere die Gesundheit der Pflanze, identifiziere Probleme und gib konkrete Handlungsempfehlungen.`;
}

async function updateDiaryInsights(diary, analysis, base44) {
  const currentInsights = diary.ai_insights || {};
  
  const newInsights = {
    ...currentInsights,
    last_analysis: new Date().toISOString(),
    last_analysis_summary: generateSummary(analysis),
    current_issues: analysis.detected_issues?.map(i => i.description) || [],
    recommendations: analysis.action_items?.map(a => a.action) || []
  };

  // Update health score
  const healthScoreMap = {
    'excellent': 95,
    'good': 80,
    'fair': 60,
    'poor': 40,
    'critical': 20
  };
  newInsights.health_score = healthScoreMap[analysis.health_assessment] || 70;

  await base44.entities.GrowDiary.update(diary.id, {
    ai_insights: newInsights
  });
}

function generateSummary(analysis) {
  const health = analysis.health_assessment || 'good';
  const issueCount = analysis.detected_issues?.length || 0;
  
  if (issueCount === 0) {
    return `Deine Pflanze ist in ${health === 'excellent' ? 'exzellentem' : 'gutem'} Zustand! Weiter so!`;
  }
  
  return `Gesundheitszustand: ${health}. ${issueCount} Problem${issueCount > 1 ? 'e' : ''} erkannt. Handlungsempfehlungen verfügbar.`;
}

// ✅ DENO SERVE Wrapper
Deno.serve(async (req) => {
  const result = await analyzeEntry(req);
  return Response.json(result);
});