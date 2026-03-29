import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { secureWrapper } from '../_shared/secureWrapper.js';
import { RATE_LIMITS } from '../_shared/rateLimiter.js';
import { validateSchema, hasXss, hasSqlInjection } from '../_shared/validation.js';

/**
 * 📝 CREATE POST - SECURED VERSION
 */

const POST_SCHEMA = {
  content: {
    type: 'string',
    maxLength: 5000,
    required: false
  },
  media_urls: {
    type: 'array',
    maxItems: 10,
    required: false
  },
  visibility: {
    type: 'string',
    enum: ['public', 'friends', 'private'],
    required: false
  },
  post_type: {
    type: 'string',
    enum: ['general', 'question', 'tutorial', 'review', 'video', 'grow_diary_update'],
    required: false
  }
};

async function handler(req, { base44, user, body }) {
  // ✅ Validate input
  const validation = validateSchema(body, POST_SCHEMA);
  if (!validation.valid) {
    return Response.json({
      error: 'Validation failed',
      message: validation.errors[0]
    }, { status: 400 });
  }

  const { content, media_urls, poll, visibility, post_type } = body;

  // ✅ Content required if no media
  if (!content?.trim() && (!media_urls || media_urls.length === 0) && !poll) {
    return Response.json({
      error: 'Empty post',
      message: 'Füge Text, Medien oder eine Umfrage hinzu'
    }, { status: 400 });
  }

  // ✅ Security checks
  if (content) {
    if (hasXss(content) || hasSqlInjection(content)) {
      return Response.json({
        error: 'Invalid content',
        message: 'Post enthält nicht erlaubte Zeichen'
      }, { status: 400 });
    }
  }

  // ✅ Create post (draft initially)
  const postData = {
    content: content?.trim() || '',
    media_urls: media_urls || [],
    poll: poll || null,
    visibility: visibility || 'public',
    post_type: post_type || 'general',
    status: 'draft',
    moderation_status: 'pending'
  };

  const newPost = await base44.entities.Post.create(postData);

  // ✅ Trigger moderation
  if (newPost?.id) {
    try {
      const moderationResponse = await base44.functions.invoke('moderation/moderatePost', {
        postId: newPost.id
      });

      const updatedPosts = await base44.entities.Post.filter({ id: newPost.id });
      const updatedPost = updatedPosts[0] || newPost;

      return Response.json({
        success: true,
        post: updatedPost,
        moderation: moderationResponse.data?.moderation
      });
    } catch (error) {
      console.error('Moderation failed:', error);
      return Response.json({
        success: true,
        post: newPost,
        warning: 'Moderation konnte nicht durchgeführt werden'
      });
    }
  }

  return Response.json({
    success: true,
    post: newPost
  });
}

// Wrap with security
export default Deno.serve(
  secureWrapper(handler, {
    requireAuth: true,
    rateLimit: RATE_LIMITS.createPost,
    maxBodySizeKB: 512,
    sanitizeInputs: true
  })
);