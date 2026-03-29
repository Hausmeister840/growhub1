import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * 🛡️ AUTO-MODERATION
 * Prüft Posts automatisch vor Veröffentlichung
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await req.json();

    if (!postId) {
      return Response.json({ error: 'Missing postId' }, { status: 400 });
    }

    // Get the post
    const posts = await base44.asServiceRole.entities.Post.filter({ id: postId });
    const post = posts[0];

    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    // Prepare content for moderation
    const content = post.content || '';
    const mediaUrls = post.media_urls || [];
    
    // Build moderation prompt
    const moderationPrompt = `
SYSTEM: Du bist ein Content-Moderator für eine Cannabis-Community-App in Deutschland.

AUFGABE: Bewerte folgenden Post auf potentiell schädliche, illegale oder ungeeignete Inhalte.

RICHTLINIEN:
✅ ERLAUBT:
- Cannabis-Diskussionen (Anbau, Medizin, Kultur)
- Grow-Dokumentation und Tipps
- Strain-Reviews und Erfahrungen
- Aufklärung und Bildung

❌ VERBOTEN:
- Verkaufsangebote (außer im Marketplace)
- Illegale Aktivitäten
- Gewalt oder Hate Speech
- Spam oder irrelevante Werbung
- Inhalte für unter 18-Jährige ungeeignet
- Aufforderung zu Straftaten

POST-INHALT:
${content}

MEDIEN: ${mediaUrls.length} Datei(en)

BEWERTE UND ANTWORTE MIT:
- allowed: true/false
- violations: Array mit gefundenen Verstößen (leer wenn keine)
- action: "allow"|"warn"|"age_restrict"|"block"
- severity: "none"|"low"|"medium"|"high"|"critical"
- reason: Kurze Begründung (max 200 Zeichen)
`;

    // Call moderation AI
    const moderationResult = await base44.integrations.Core.InvokeLLM({
      prompt: moderationPrompt,
      response_json_schema: {
        type: 'object',
        required: ['allowed', 'violations', 'action', 'severity', 'reason'],
        properties: {
          allowed: { type: 'boolean' },
          violations: { 
            type: 'array', 
            items: { 
              type: 'string',
              enum: ['illegal_sale', 'illegal_activity', 'violence', 'hate_speech', 'spam', 'age_inappropriate', 'other']
            }
          },
          action: { 
            type: 'string', 
            enum: ['allow', 'warn', 'age_restrict', 'block'] 
          },
          severity: {
            type: 'string',
            enum: ['none', 'low', 'medium', 'high', 'critical']
          },
          reason: { type: 'string', maxLength: 200 }
        }
      }
    });

    // Apply moderation decision
    let updateData = {
      moderation_status: moderationResult.action,
      moderation_reason: moderationResult.reason,
      moderation_checked_at: new Date().toISOString(),
    };
    
    // Status basiert auf Action
    if (moderationResult.action === 'allow') {
      updateData.status = 'published';
    } else if (moderationResult.action === 'warn' || moderationResult.action === 'age_restrict') {
      updateData.status = 'published';
      updateData.sensitive = true;
      updateData.content_warning = moderationResult.reason;
    } else if (moderationResult.action === 'block') {
      updateData.status = 'removed';
      updateData.visibility = 'private';
    }

    // Bei hoher Severity → Manual Review
    if (moderationResult.severity === 'high' || moderationResult.severity === 'critical') {
      updateData.status = 'under_review';
      updateData.requires_manual_review = true;
    }

    // Update post
    await base44.asServiceRole.entities.Post.update(postId, updateData);

    // Log moderation event
    try {
      await base44.asServiceRole.entities.AppEvent.create({
        user_email: user.email,
        type: 'moderation_check',
        data: {
          post_id: postId,
          action: moderationResult.action,
          violations: moderationResult.violations,
          severity: moderationResult.severity,
          automated: true
        },
        timestamp: new Date().toISOString()
      });
    } catch (logError) {
      console.warn('Failed to log moderation event:', logError);
    }

    // Benachrichtige User bei Block
    if (moderationResult.action === 'block') {
      try {
        await base44.integrations.Core.SendEmail({
          to: post.created_by,
          subject: 'Post wurde entfernt - GrowHub',
          body: `
Hallo,

dein Post wurde aufgrund eines Verstoßes gegen unsere Community-Richtlinien entfernt.

Grund: ${moderationResult.reason}

Verstöße: ${moderationResult.violations.join(', ')}

Bei Fragen wende dich bitte an support@growhub.de

Beste Grüße,
Das GrowHub Team
          `
        });
      } catch (emailError) {
        console.warn('Failed to send notification email:', emailError);
      }
    }

    return Response.json({
      success: true,
      moderation: moderationResult,
      post_status: updateData.status,
      requires_manual_review: updateData.requires_manual_review || false
    });

  } catch (error) {
    console.error('Moderation Error:', error);
    return Response.json({ 
      error: 'Moderation failed', 
      details: error.message 
    }, { status: 500 });
  }
});