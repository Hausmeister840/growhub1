import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * 🧬 EMBEDDING GENERATOR
 * Erstellt Vector Embeddings für Content und User Interessen
 * Basis für personalisierte Empfehlungen
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Admin only
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { type, target_id } = await req.json();

    if (type === 'content') {
      return await generateContentEmbedding(base44, target_id);
    } else if (type === 'user') {
      return await generateUserEmbedding(base44, target_id);
    }

    return Response.json({ error: 'Invalid type' }, { status: 400 });

  } catch (error) {
    console.error('Embedding generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Generiere Content Embedding für einen Post
 */
async function generateContentEmbedding(base44, postId) {
  const post = await base44.entities.Post.get(postId);
  if (!post) {
    throw new Error('Post not found');
  }

  // Erstelle Text-Repräsentation des Posts
  const contentText = [
    post.content || '',
    post.tags?.join(' ') || '',
    post.category || '',
    post.post_type || ''
  ].join(' ').trim();

  if (!contentText) {
    return Response.json({ error: 'No content to embed' }, { status: 400 });
  }

  // Generiere Embedding via LLM (über SDK)
  const embedding = await base44.integrations.Core.InvokeLLM({
    prompt: `Generate a semantic embedding for this cannabis community content:\n\n${contentText}\n\nExtract key topics and themes.`,
    response_json_schema: {
      type: 'object',
      properties: {
        topics: {
          type: 'array',
          items: { type: 'string' },
          description: 'Key topics mentioned (e.g., indoor, nutrients, LED, harvest)'
        },
        sentiment: {
          type: 'string',
          enum: ['positive', 'neutral', 'negative', 'question']
        },
        expertise_level: {
          type: 'string',
          enum: ['beginner', 'intermediate', 'expert']
        }
      }
    }
  });

  const topics = embedding.topics || [];
  const vector = generateSimpleVector(contentText, topics);

  // Speichere oder update Embedding
  const existing = await base44.entities.ContentEmbedding.filter({
    post_id: postId
  });

  const embeddingData = {
    post_id: postId,
    vector,
    modality: post.media_urls?.length > 0 ? 'image' : 'text',
    topics,
    generated_at: new Date().toISOString()
  };

  if (existing.length > 0) {
    await base44.entities.ContentEmbedding.update(existing[0].id, embeddingData);
  } else {
    await base44.entities.ContentEmbedding.create(embeddingData);
  }

  return Response.json({
    success: true,
    embedding: embeddingData
  });
}

/**
 * Generiere User Embedding basierend auf Interaktionen
 */
async function generateUserEmbedding(base44, userEmail) {
  // Hole User-Interaktionen
  const [likedPosts, userPosts, bookmarks] = await Promise.all([
    base44.entities.Post.list('-created_date', 100),
    base44.entities.Post.filter({ created_by: userEmail }),
    base44.entities.Post.filter({ 
      bookmarked_by_users: userEmail 
    })
  ]);

  // Filter liked posts (wo user in reactions ist)
  const actualLikedPosts = likedPosts.filter(post => {
    const reactions = post.reactions || {};
    return Object.values(reactions).some(r => 
      r.users?.includes(userEmail)
    );
  });

  // Sammle alle Topics
  const allTopics = new Set();
  const allCategories = new Set();

  [...actualLikedPosts, ...userPosts, ...bookmarks].forEach(post => {
    (post.tags || []).forEach(tag => allTopics.add(tag));
    if (post.category) allCategories.add(post.category);
  });

  const topicsArray = Array.from(allTopics);
  const vector = generateSimpleVector(
    `${Array.from(allTopics).join(' ')} ${Array.from(allCategories).join(' ')}`,
    topicsArray
  );

  // Speichere User Embedding
  const existing = await base44.entities.UserEmbedding.filter({
    user_email: userEmail
  });

  const embeddingData = {
    user_email: userEmail,
    vector,
    topics_preference: topicsArray.slice(0, 20),
    last_update: new Date().toISOString()
  };

  if (existing.length > 0) {
    await base44.entities.UserEmbedding.update(existing[0].id, embeddingData);
  } else {
    await base44.entities.UserEmbedding.create(embeddingData);
  }

  return Response.json({
    success: true,
    embedding: embeddingData
  });
}

/**
 * Simple Vector Generation (384 dims)
 * In Production: Use proper embedding model
 */
function generateSimpleVector(text, topics) {
  const vector = new Array(384).fill(0);
  
  // Simple hash-based approach
  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    const hash = simpleHash(topic);
    const index = Math.abs(hash) % 384;
    vector[index] = Math.min(1, vector[index] + 0.2);
  }

  // Normalize
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  return magnitude > 0 ? vector.map(v => v / magnitude) : vector;
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return hash;
}