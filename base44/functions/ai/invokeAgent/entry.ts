import { InvokeLLM } from '@/integrations/Core';
import { secureWrapper } from '../../_shared/secureWrapper.js';
import { RATE_LIMITS } from '../../_shared/rateLimiter.js';

Deno.serve(secureWrapper(async (req, { base44, user, body }) => {
  try {
    const { agent, payload, schema_ref, file_urls } = body || {};

    if (!agent || !payload) {
      return Response.json({ error: 'Missing agent or payload' }, { status: 400 });
    }

    // Generate input hash for caching
    const input_hash = await hashPayload({ agent, payload, file_urls });

    // Check cache first
    const cached = await getCachedResponse(base44, user.email, agent, input_hash);
    if (cached && new Date(cached.expires_at) > new Date()) {
      await logEvent(base44, user.email, 'ai_cache_hit', { agent, input_hash });
      return Response.json({ ...cached.response, cache: true });
    }

    // Get prompt template
    const template = await getPromptTemplate(base44, agent);
    if (!template) {
      return Response.json({ error: `Unknown agent: ${agent}` }, { status: 404 });
    }

    // Render prompt with variables
    const renderedPrompt = renderPrompt(template.template, payload);

    // Call AI with optional schema validation
    const startTime = Date.now();
    const response = await InvokeLLM({
      prompt: renderedPrompt,
      response_json_schema: schema_ref ? await loadSchema(schema_ref) : undefined,
      file_urls
    });
    const latency_ms = Date.now() - startTime;

    // Cache the response (24h TTL)
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await base44.entities.AIResponse.create({
      user_email: user.email,
      agent,
      input_hash,
      response,
      tokens: response.usage?.total_tokens || 0,
      latency_ms,
      expires_at
    });

    // Log successful AI call
    await logEvent(base44, user.email, 'ai_call', { 
      agent, 
      latency_ms, 
      tokens: response.usage?.total_tokens || 0 
    });

    return Response.json({ ...response, cache: false });

  } catch (error) {
    console.error('AI Agent Error:', error);
    return Response.json({ 
      error: 'AI request failed', 
      details: error.message 
    }, { status: 500 });
  }
}, {
  requireAuth: true,
  rateLimit: RATE_LIMITS.ai,
  maxBodySizeKB: 256
}));

// Helper functions
async function hashPayload(obj) {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(obj));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getCachedResponse(base44, user_email, agent, input_hash) {
  try {
    const cached = await base44.entities.AIResponse.filter({
      user_email,
      agent,
      input_hash
    });
    return cached[0] || null;
  } catch (error) {
    console.warn('Cache lookup failed:', error);
    return null;
  }
}

async function getPromptTemplate(base44, agent) {
  try {
    const templates = await base44.asServiceRole.entities.PromptTemplate.filter({ key: agent });
    return templates[0] || null;
  } catch (error) {
    console.warn('Template lookup failed:', error);
    return null;
  }
}

function renderPrompt(template, data) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return data[key] || '';
  });
}

async function loadSchema(schema_ref) {
  // Simple schema mapping - in real app, load from file system or database
  const schemas = {
    'PlantDoctor': {
      type: 'object',
      required: ['diagnosis', 'causes', 'actions', 'confidence', 'urgency'],
      properties: {
        diagnosis: { type: 'string', maxLength: 200 },
        causes: { type: 'array', items: { type: 'string' } },
        actions: { type: 'array', items: { type: 'string' } },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        urgency: { type: 'string', enum: ['low', 'medium', 'high'] }
      }
    },
    'StrainFinder': {
      type: 'object',
      required: ['strains', 'top_pick'],
      properties: {
        strains: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              why: { type: 'string' },
              grow_tips: { type: 'string' }
            }
          }
        },
        top_pick: { type: 'string' }
      }
    }
  };
  
  return schemas[schema_ref] || null;
}

async function logEvent(base44, user_email, type, data) {
  try {
    await base44.entities.AppEvent.create({
      user_email,
      type,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.warn('Event logging failed:', error);
  }
}