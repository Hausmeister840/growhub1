import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const BLOCKED_KEYWORDS = [
  'verkauf', 'verkaufe', 'kaufen', 'dealer', 'whatsapp',
  'telegram', 'wickr', 'signal', 'kontakt', 'dm me',
  'buy', 'sell', 'weed for sale', 'hash for sale'
];

const WARN_KEYWORDS = [
  'joint', 'bong', 'kiffen', 'high', 'stoned'
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, post_id } = await req.json();

    if (!content) {
      return Response.json({ 
        success: true,
        result: 'allow',
        reason: 'No content to moderate'
      });
    }

    const lowerContent = content.toLowerCase();

    // Check for blocked content
    const blockedFound = BLOCKED_KEYWORDS.some(keyword => 
      lowerContent.includes(keyword)
    );

    if (blockedFound) {
      if (post_id) {
        await base44.asServiceRole.entities.Post.update(post_id, {
          moderation_status: 'block',
          moderation_reason: 'Enthält verbotene Inhalte (Verkauf/Handel)',
          moderation_checked_at: new Date().toISOString(),
          requires_manual_review: true
        });
      }

      return Response.json({
        success: true,
        result: 'block',
        reason: 'Enthält verbotene Inhalte (Verkauf/Handel)'
      });
    }

    // Check for warning content
    const warnFound = WARN_KEYWORDS.some(keyword => 
      lowerContent.includes(keyword)
    );

    if (warnFound) {
      if (post_id) {
        await base44.asServiceRole.entities.Post.update(post_id, {
          moderation_status: 'warn',
          moderation_reason: 'Enthält sensible Begriffe',
          moderation_checked_at: new Date().toISOString(),
          sensitive: true,
          content_warning: 'Dieser Post enthält Cannabis-bezogene Inhalte'
        });
      }

      return Response.json({
        success: true,
        result: 'warn',
        reason: 'Enthält sensible Begriffe',
        content_warning: 'Dieser Post enthält Cannabis-bezogene Inhalte'
      });
    }

    // Content is clean
    if (post_id) {
      await base44.asServiceRole.entities.Post.update(post_id, {
        moderation_status: 'allow',
        moderation_checked_at: new Date().toISOString()
      });
    }

    return Response.json({
      success: true,
      result: 'allow',
      reason: 'Content approved'
    });

  } catch (error) {
    console.error('Moderation error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});