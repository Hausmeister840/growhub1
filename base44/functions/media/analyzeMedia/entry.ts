import { createClientFromRequest } from 'npm:@base44/sdk@0.7.0';

// Media analysis prompts
const ANALYSIS_PROMPTS = {
  plant_diagnosis: {
    system: `Du bist ein erfahrener Cannabis-Pflanzenarzt. Analysiere das Bild und identifiziere Probleme, Krankheiten oder Mangelerscheinungen.`,
    user: `Analysiere dieses Cannabis-Pflanzenbild systematisch. Achte auf:
- Blattfarbe und -form
- Verfärbungen oder Flecken
- Wachstumsstörungen
- Anzeichen von Schädlingen oder Krankheiten
- Nährstoffmängel oder -überschüsse

Gib eine strukturierte Diagnose mit konkreten Handlungsempfehlungen.`,
    schema: {
      type: "object",
      properties: {
        health_status: { type: "string", enum: ["healthy", "minor_issues", "moderate_issues", "severe_issues"] },
        issues_found: { type: "array", items: { type: "string" } },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        recommendations: { type: "array", items: { type: "string" } },
        urgency: { type: "string", enum: ["low", "medium", "high", "critical"] }
      }
    }
  },

  harvest_readiness: {
    system: `Du bist ein Harvest-Experte. Analysiere Trichome und Blütenstände, um die Erntereife zu bestimmen.`,
    user: `Bestimme die Erntereife dieser Cannabis-Pflanze. Analysiere:
- Trichome-Farbe (klar, milchig, bernsteinfarben)
- Pistil-Rückzug und -färbung
- Blütendichte und -reife
- Gesamterscheinungsbild

Gib eine präzise Einschätzung des Erntezeitpunkts.`,
    schema: {
      type: "object", 
      properties: {
        harvest_status: { type: "string", enum: ["too_early", "early_window", "optimal", "late_optimal", "overripe"] },
        days_to_harvest: { type: "number", description: "Geschätzte Tage bis zur optimalen Ernte" },
        trichome_status: { type: "string" },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        notes: { type: "array", items: { type: "string" } }
      }
    }
  },

  quality_assessment: {
    system: `Du bist ein Cannabis-Qualitätsexperte. Bewerte die Qualität und Potenz der Blüten.`,
    user: `Bewerte die Qualität dieser Cannabis-Blüten. Analysiere:
- Trichome-Dichte und -Klarheit
- Blütenstruktur und -dichte
- Farbe und Erscheinungsbild
- Sichtbare Qualitätsmerkmale

Gib eine strukturierte Qualitätsbewertung.`,
    schema: {
      type: "object",
      properties: {
        overall_quality: { type: "string", enum: ["poor", "fair", "good", "excellent", "premium"] },
        quality_score: { type: "number", minimum: 0, maximum: 10 },
        strengths: { type: "array", items: { type: "string" } },
        improvements: { type: "array", items: { type: "string" } },
        estimated_potency: { type: "string" },
        confidence: { type: "number", minimum: 0, maximum: 1 }
      }
    }
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { media_id, analysis_type = 'plant_diagnosis' } = await req.json();

    if (!media_id) {
      return Response.json({
        ok: false,
        error: 'media_id_required'
      }, { status: 400 });
    }

    console.log(`🔬 Analyzing media ${media_id} for ${analysis_type}`);

    // Get media asset
    const mediaAssets = await base44.entities.MediaAsset.filter({ id: media_id });
    if (!mediaAssets.length) {
      return Response.json({
        ok: false,
        error: 'media_not_found'
      }, { status: 404 });
    }

    const media = mediaAssets[0];

    // Get analysis prompt
    const promptConfig = ANALYSIS_PROMPTS[analysis_type];
    if (!promptConfig) {
      return Response.json({
        ok: false,
        error: 'invalid_analysis_type'
      }, { status: 400 });
    }

    // Call multimodal LLM with image
    const llmResponse = await fetch('/api/functions/ai/invokeLLM', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.get('Authorization')
      },
      body: JSON.stringify({
        prompt: `${promptConfig.system}\n\n${promptConfig.user}`,
        file_urls: [media.url],
        response_json_schema: promptConfig.schema,
        allowThinking: false,
        useCache: true,
        cacheTTL: 600 // 10 minutes cache for media analysis
      })
    });

    if (!llmResponse.ok) {
      throw new Error(`LLM analysis failed: ${llmResponse.status}`);
    }

    const llmResult = await llmResponse.json();

    if (!llmResult.ok) {
      throw new Error(`LLM error: ${llmResult.error}`);
    }

    const analysisData = llmResult.response;

    // Create insight record
    const insight = await base44.entities.MediaInsight.create({
      media_id: media_id,
      kind: analysis_type,
      summary: generateSummary(analysisData, analysis_type),
      actions: extractActions(analysisData),
      issues: extractIssues(analysisData),
      confidence: analysisData.confidence || 0.8,
      raw_data: analysisData,
      processed: true
    });

    console.log(`✅ Media analysis completed: ${insight.id}`);

    return Response.json({
      ok: true,
      insight_id: insight.id,
      analysis_type,
      summary: insight.summary,
      confidence: insight.confidence,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Analyze media error:', error);
    
    return Response.json({
      ok: false,
      error: 'analysis_failed',
      message: error.message
    }, { status: 500 });
  }
});

// Helper functions
function generateSummary(data, type) {
  switch (type) {
    case 'plant_diagnosis':
      return `Gesundheitsstatus: ${data.health_status || 'unbekannt'}. ${data.issues_found?.length || 0} Probleme identifiziert.`;
    case 'harvest_readiness':
      return `Erntestatus: ${data.harvest_status || 'unbekannt'}. ${data.days_to_harvest ? `${data.days_to_harvest} Tage bis zur Ernte.` : ''}`;
    case 'quality_assessment':
      return `Qualität: ${data.overall_quality || 'unbekannt'} (${data.quality_score || 0}/10)`;
    default:
      return 'Analyse abgeschlossen';
  }
}

function extractActions(data) {
  const actions = [];
  
  if (data.recommendations) {
    actions.push(...data.recommendations);
  }
  
  if (data.notes) {
    actions.push(...data.notes);
  }

  if (data.improvements) {
    actions.push(...data.improvements);
  }

  return actions.slice(0, 5); // Limit to 5 actions
}

function extractIssues(data) {
  const issues = [];
  
  if (data.issues_found) {
    issues.push(...data.issues_found);
  }

  if (data.health_status && ['moderate_issues', 'severe_issues'].includes(data.health_status)) {
    issues.push(`Gesundheitszustand: ${data.health_status}`);
  }

  if (data.urgency && ['high', 'critical'].includes(data.urgency)) {
    issues.push(`Dringlichkeit: ${data.urgency}`);
  }

  return issues.slice(0, 5); // Limit to 5 issues
}