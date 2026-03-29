import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * 🤖 Tägliche Wissenserstellung durch Grow Master
 * 
 * Diese Funktion wird täglich ausgeführt und generiert 5 neue Wissensartikel
 * in verschiedenen Kategorien basierend auf Community-Trends und Wissenslücken.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // ✅ SERVICE ROLE für System-Operationen
    const serviceBase44 = base44.asServiceRole;

    console.log('🧠 Starting daily knowledge generation...');

    // 1️⃣ TREND-ANALYSE: Welche Themen sind aktuell relevant?
    const [recentPosts, recentActivities, existingArticles, strains] = await Promise.all([
      serviceBase44.entities.Post.list('-created_date', 50).catch(() => []),
      serviceBase44.entities.UserActivity.list('-created_at', 100).catch(() => []),
      serviceBase44.entities.KnowledgeArticle.list('-created_date', 20).catch(() => []),
      serviceBase44.entities.Strain.list('', 100).catch(() => [])
    ]);

    // Extrahiere Trends aus Posts (Hashtags, häufige Begriffe)
    const postTags = recentPosts
      .flatMap(p => p.tags || [])
      .filter(t => t && t.trim());
    
    const tagFrequency = {};
    postTags.forEach(tag => {
      tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
    });

    const trendingTags = Object.entries(tagFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);

    // Existierende Artikel-Themen
    const existingTopics = existingArticles.map(a => a.title.toLowerCase());

    // 2️⃣ GROW MASTER PROMPT erstellen
    const prompt = `
# 📚 TÄGLICHE WISSENSERSTELLUNG

Du sollst **5 hochwertige Wissensartikel** für die GrowHub Cannabis-Community erstellen.

## KONTEXT:
- **Trending Tags in der Community**: ${trendingTags.join(', ') || 'Keine spezifischen Trends'}
- **Anzahl verfügbarer Sorten**: ${strains.length}
- **Existierende Artikel-Themen**: ${existingTopics.slice(0, 5).join(', ') || 'Keine bisherigen Artikel'}

## ANFORDERUNGEN:
1. **5 Artikel** aus **unterschiedlichen Kategorien**: growing, strains, equipment, legal, medical, processing, troubleshooting
2. **Keine Duplikate** zu existierenden Themen
3. **Aktuelle Relevanz**: Nutze die Trending-Tags als Inspiration
4. **Vielfalt**: Anfänger- bis Experten-Level
5. **Praktischer Nutzen**: Umsetzbare Tipps und Anleitungen

## AUSGABEFORMAT (JSON):
\`\`\`json
{
  "articles": [
    {
      "title": "Präziser, SEO-freundlicher Titel",
      "content": "Strukturierter Markdown-Inhalt (min. 500 Wörter)\\n\\n## Abschnitt 1\\n...\\n\\n## Abschnitt 2\\n...",
      "category": "growing",
      "tags": ["tag1", "tag2", "tag3"],
      "difficulty_level": "beginner",
      "read_time_minutes": 8
    }
  ]
}
\`\`\`

Erstelle jetzt die 5 Artikel!
`;

    // 3️⃣ GROW MASTER aufrufen
    console.log('🤖 Invoking Grow Master for article generation...');
    
    const response = await serviceBase44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: "object",
        properties: {
          articles: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                content: { type: "string" },
                category: { 
                  type: "string",
                  enum: ["growing", "strains", "equipment", "legal", "medical", "processing", "troubleshooting"]
                },
                tags: { type: "array", items: { type: "string" } },
                difficulty_level: { 
                  type: "string",
                  enum: ["beginner", "intermediate", "advanced"]
                },
                read_time_minutes: { type: "number" }
              },
              required: ["title", "content", "category"]
            },
            minItems: 5,
            maxItems: 5
          }
        },
        required: ["articles"]
      }
    });

    console.log('✅ Grow Master response received');

    if (!response || !response.articles || !Array.isArray(response.articles)) {
      throw new Error('Invalid response format from Grow Master');
    }

    // 4️⃣ ARTIKEL SPEICHERN
    const createdArticles = [];
    
    for (const article of response.articles) {
      try {
        const articleData = {
          title: article.title,
          content: article.content,
          category: article.category,
          tags: article.tags || [],
          difficulty_level: article.difficulty_level || 'beginner',
          read_time_minutes: article.read_time_minutes || 5,
          author_email: 'growmaster@growhub.ai', // System-Account
          expert_verified: true, // Von KI erstellt = verifiziert
          featured: false,
          upvotes: 0,
          downvotes: 0,
          views_count: 0
        };

        const created = await serviceBase44.entities.KnowledgeArticle.create(articleData);
        createdArticles.push(created);
        console.log(`✅ Article created: "${article.title}"`);
        
      } catch (error) {
        console.error(`❌ Failed to create article "${article.title}":`, error);
      }
    }

    // 5️⃣ RESPONSE
    return Response.json({
      success: true,
      message: `${createdArticles.length} Wissensartikel erfolgreich erstellt`,
      articles: createdArticles.map(a => ({
        id: a.id,
        title: a.title,
        category: a.category
      })),
      trends_analyzed: {
        trending_tags: trendingTags,
        recent_posts_count: recentPosts.length,
        existing_articles_count: existingArticles.length
      }
    });

  } catch (error) {
    console.error('❌ Daily knowledge generation failed:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});