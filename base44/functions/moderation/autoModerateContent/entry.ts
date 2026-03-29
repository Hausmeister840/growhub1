import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * 🛡️ AUTO-MODERATION SYSTEM
 * Nutzt AI um Content automatisch zu moderieren
 * - NSFW Detection
 * - Hate Speech Detection
 * - Spam Detection
 * - Community Guidelines Enforcement
 */

const MODERATION_RULES = {
  // Automatisch blockieren
  auto_block: [
    'illegal_content',
    'extreme_violence',
    'child_safety',
    'severe_hate_speech'
  ],
  
  // Warnung + Age Restriction
  age_restrict: [
    'sexual_content',
    'graphic_violence',
    'drug_use_graphic'
  ],
  
  // Nur warnen
  warn: [
    'mild_profanity',
    'controversial_topic',
    'unverified_medical_advice'
  ]
};

const CANNABIS_SPECIFIC_RULES = {
  allowed: [
    'grow_discussion',
    'strain_info',
    'equipment_review',
    'harvest_photos',
    'grow_diary',
    'medical_discussion'
  ],
  
  restricted: [
    'sale_solicitation',
    'illegal_state_discussion',
    'minor_access',
    'driving_impaired'
  ]
};

Deno.serve(async (req) => {
  const startTime = Date.now();
  
  try {
    const base44 = createClientFromRequest(req);
    
    // ✅ Service Role für Moderation
    const body = await req.json();
    const { post_id, content, media_urls = [], user_email } = body;

    if (!post_id || !content) {
      return Response.json({
        success: false,
        error: 'post_id and content required'
      }, { status: 400 });
    }

    console.log(`🛡️ [AutoModeration] Checking post ${post_id}`);

    // ✅ AI-basierte Content-Analyse
    const moderationPrompt = `Du bist ein Content-Moderator für eine Cannabis-Community-App (legal, 18+).

**Zu prüfender Content:**
${content}

**Cannabis-spezifische Regeln:**
✅ ERLAUBT: Grow-Diskussionen, Strain-Info, Equipment, Erntefotos, medizinische Diskussionen
❌ VERBOTEN: Verkaufsangebote, Minderjährigen-Zugang, illegale Aktivitäten in Nicht-Legal-Staaten

**Prüfe auf:**
1. Illegale Inhalte (Verkauf, Handel, etc.)
2. Jugendschutz-Verletzungen
3. Hassrede oder Diskriminierung
4. Spam oder Werbung
5. Falsche medizinische Beratung
6. Gewaltverherrlichung

**Antworte mit JSON:`;

    let analysis;
    try {
      analysis = await base44.integrations.Core.InvokeLLM({
        prompt: moderationPrompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: 'object',
          properties: {
            is_safe: {
              type: 'boolean',
              description: 'true wenn Content sicher ist'
            },
            risk_level: {
              type: 'string',
              enum: ['safe', 'low', 'medium', 'high', 'critical']
            },
            detected_issues: {
              type: 'array',
              items: { type: 'string' },
              description: 'Liste der gefundenen Probleme'
            },
            action: {
              type: 'string',
              enum: ['allow', 'warn', 'age_restrict', 'block', 'manual_review']
            },
            reason: {
              type: 'string',
              description: 'Begründung für die Entscheidung'
            },
            confidence: {
              type: 'number',
              description: 'Confidence Score 0-1'
            }
          }
        }
      });
    } catch (aiError) {
      console.error('AI moderation error:', aiError);
      // Fallback: Manual Review
      analysis = {
        is_safe: true,
        risk_level: 'medium',
        detected_issues: ['ai_analysis_failed'],
        action: 'manual_review',
        reason: 'AI-Analyse fehlgeschlagen, manuelle Prüfung erforderlich',
        confidence: 0
      };
    }

    console.log(`🛡️ [AutoModeration] Result:`, analysis);

    // ✅ Action ausführen
    const updates = {
      moderation_checked_at: new Date().toISOString(),
      moderation_status: analysis.action,
      moderation_reason: analysis.reason,
      requires_manual_review: analysis.action === 'manual_review' || analysis.confidence < 0.7
    };

    // Status-Mapping
    if (analysis.action === 'block') {
      updates.status = 'removed';
      updates.sensitive = true;
      updates.content_warning = 'Dieser Content wurde entfernt';
    } else if (analysis.action === 'age_restrict') {
      updates.status = 'published';
      updates.sensitive = true;
      updates.content_warning = 'Dieser Content enthält sensible Themen (18+)';
    } else if (analysis.action === 'warn') {
      updates.status = 'published';
      updates.moderation_notes = JSON.stringify({
        warnings: analysis.detected_issues,
        checked_at: new Date().toISOString()
      });
    } else {
      updates.status = 'published';
    }

    // ✅ Post updaten
    await base44.asServiceRole.entities.Post.update(post_id, updates);

    // ✅ Bei kritischen Fällen: Report erstellen
    if (analysis.risk_level === 'critical' || analysis.action === 'block') {
      try {
        await base44.asServiceRole.entities.Report.create({
          target_type: 'post',
          target_id: post_id,
          reporter_email: 'system@growhub.app',
          reason: `Auto-Moderation: ${analysis.reason}`,
          status: 'review',
          moderator_notes: JSON.stringify(analysis)
        });
      } catch (reportError) {
        console.error('Error creating report:', reportError);
      }
    }

    const processingTime = Date.now() - startTime;

    return Response.json({
      success: true,
      post_id,
      moderation: {
        action: analysis.action,
        risk_level: analysis.risk_level,
        detected_issues: analysis.detected_issues,
        confidence: analysis.confidence,
        requires_manual_review: updates.requires_manual_review
      },
      processing_time_ms: processingTime
    });

  } catch (error) {
    console.error('❌ Auto-moderation error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});