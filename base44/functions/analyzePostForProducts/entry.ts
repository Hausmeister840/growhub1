import { createClientFromRequest } from 'npm:@base44/sdk@0.7.0';

async function analyzePostForProducts(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { post_id } = await req.json();

    if (!post_id) {
      return Response.json({ error: 'Missing post_id' }, { status: 400 });
    }

    // Get the post
    let post;
    try {
      post = await base44.entities.Post.filter({ id: post_id });
      if (!post || post.length === 0) {
        return Response.json({ error: 'Post not found' }, { status: 404 });
      }
      post = post[0];
    } catch (error) {
      console.error('Failed to fetch post:', error);
      return Response.json({ error: 'Failed to fetch post' }, { status: 500 });
    }

    // Build analysis prompt
    const analysisPrompt = `
Analysiere diesen Cannabis-Post auf erwähnte Produkte oder Equipment:

Content: "${post.content || ''}"
Tags: ${post.tags ? post.tags.join(', ') : 'Keine'}
Kategorie: ${post.category || 'general'}

Identifiziere:
1. Erwähnte Cannabis-Produkte (Seeds, Strains, Equipment, Nährstoffe)
2. Marken oder spezifische Produktnamen
3. Kaufinteresse-Signale ("suche", "kaufe", "brauche")
4. Verkaufsangebote ("verkaufe", "biete an", "zu haben")

Antworte mit JSON:
{
  "mentions": [
    {
      "type": "seed|strain|equipment|nutrient|accessory|other",
      "name": "Produktname",
      "brand": "Markenname oder null",
      "context": "Kurzer Kontext aus dem Post",
      "intent": "buy|sell|discuss|review"
    }
  ],
  "opportunities": [
    {
      "type": "marketplace|recommendation|affiliate",
      "description": "Kurze Beschreibung der Chance",
      "confidence": 0.0-1.0
    }
  ],
  "summary": "Ein-Satz-Zusammenfassung der Analyse"
}`;

    try {
      // Use Base44 SDK integrations instead of direct import
      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        response_json_schema: {
          type: "object",
          required: ["mentions", "opportunities", "summary"],
          properties: {
            mentions: {
              type: "array",
              items: {
                type: "object",
                required: ["type", "name", "context", "intent"],
                properties: {
                  type: {
                    type: "string",
                    enum: ["seed", "strain", "equipment", "nutrient", "accessory", "other"]
                  },
                  name: { type: "string" },
                  brand: { type: "string" },
                  context: { type: "string" },
                  intent: {
                    type: "string", 
                    enum: ["buy", "sell", "discuss", "review"]
                  }
                }
              }
            },
            opportunities: {
              type: "array",
              items: {
                type: "object",
                required: ["type", "description", "confidence"],
                properties: {
                  type: {
                    type: "string",
                    enum: ["marketplace", "recommendation", "affiliate"]
                  },
                  description: { type: "string" },
                  confidence: { type: "number", minimum: 0, maximum: 1 }
                }
              }
            },
            summary: { type: "string" }
          }
        }
      });

      // Log the analysis for potential future use
      try {
        await base44.entities.UserActivity.create({
          user_email: user.email,
          type: 'ai_product_analysis',
          post_id: post_id,
          meta: {
            mentions_found: aiResponse.mentions?.length || 0,
            opportunities_found: aiResponse.opportunities?.length || 0,
            timestamp: new Date().toISOString()
          }
        });
      } catch (logError) {
        console.warn('Failed to log product analysis activity:', logError);
        // Don't fail the whole function if logging fails
      }

      return Response.json({
        success: true,
        post_id,
        mentions: aiResponse.mentions || [],
        opportunities: aiResponse.opportunities || [],
        summary: aiResponse.summary || 'Keine Produkte erkannt',
        analyzed_at: new Date().toISOString()
      });

    } catch (aiError) {
      console.error('AI analysis failed:', aiError);
      
      // Return empty result instead of failing
      return Response.json({
        success: false,
        error: 'AI analysis temporarily unavailable',
        post_id,
        mentions: [],
        opportunities: [],
        summary: 'Analyse fehlgeschlagen'
      });
    }

  } catch (error) {
    console.error('❌ Product analysis error:', error);
    return Response.json({ 
      success: false,
      error: 'Analysis failed', 
      details: error.message 
    }, { status: 500 });
  }
}

// Platform V2: Export as default and setup Deno.serve
export default Deno.serve(analyzePostForProducts);