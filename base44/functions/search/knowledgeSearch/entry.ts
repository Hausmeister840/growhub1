import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * 🔍 Intelligente Wissenssuche
 * 
 * Durchsucht: KnowledgeArticle, Strain, Post, GrowDiary
 * Optional: AI-generierte Antworten bei keinen Ergebnissen
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { query, use_ai = false } = await req.json();

    if (!query || query.trim().length < 2) {
      return Response.json({
        success: false,
        error: 'Suchanfrage zu kurz (min. 2 Zeichen)'
      }, { status: 400 });
    }

    const searchTerm = query.trim().toLowerCase();
    console.log(`🔍 Searching for: "${searchTerm}"`);

    // 1️⃣ PARALLELE SUCHE in allen relevanten Entitäten
    const [articles, strains, posts, diaries] = await Promise.all([
      // Knowledge Articles
      base44.entities.KnowledgeArticle.list('-views_count', 100)
        .then(all => all.filter(a => 
          a.title?.toLowerCase().includes(searchTerm) ||
          a.content?.toLowerCase().includes(searchTerm) ||
          (a.tags || []).some(tag => tag.toLowerCase().includes(searchTerm))
        ))
        .catch(() => []),

      // Strains
      base44.entities.Strain.list('', 200)
        .then(all => all.filter(s =>
          s.name?.toLowerCase().includes(searchTerm) ||
          (s.alias || []).some(alias => alias.toLowerCase().includes(searchTerm)) ||
          s.genetics?.toLowerCase().includes(searchTerm)
        ))
        .catch(() => []),

      // Posts (Tutorials, Reviews)
      base44.entities.Post.list('-created_date', 50)
        .then(all => all.filter(p =>
          (p.post_type === 'tutorial' || p.post_type === 'review') &&
          (p.content?.toLowerCase().includes(searchTerm) ||
           (p.tags || []).some(tag => tag.toLowerCase().includes(searchTerm)))
        ))
        .catch(() => []),

      // Public Grow Diaries
      base44.entities.GrowDiary.list('-created_date', 30)
        .then(all => all.filter(d =>
          d.share_settings?.is_public &&
          (d.name?.toLowerCase().includes(searchTerm) ||
           d.strain_name?.toLowerCase().includes(searchTerm))
        ))
        .catch(() => [])
    ]);

    // 2️⃣ ERGEBNISSE AGGREGIEREN & SORTIEREN
    const results = {
      articles: articles.slice(0, 10).map(a => ({
        result_type: 'article',
        id: a.id,
        title: a.title,
        excerpt: a.content?.substring(0, 150) + '...',
        category: a.category,
        difficulty: a.difficulty_level,
        views: a.views_count,
        tags: a.tags
      })),
      
      strains: strains.slice(0, 5).map(s => ({
        result_type: 'strain',
        id: s.id,
        name: s.name,
        strain_type: s.type,
        thc: s.thc,
        effects: s.effects,
        genetics: s.genetics
      })),
      
      posts: posts.slice(0, 5).map(p => ({
        result_type: 'post',
        id: p.id,
        content: p.content?.substring(0, 100) + '...',
        post_type: p.post_type,
        author: p.created_by,
        reactions_count: Object.values(p.reactions || {}).reduce((sum, r) => sum + (r.count || 0), 0)
      })),
      
      diaries: diaries.slice(0, 5).map(d => ({
        result_type: 'diary',
        id: d.id,
        name: d.name,
        strain: d.strain_name,
        stage: d.current_stage,
        days: d.stats?.total_days || 0
      }))
    };

    const totalResults = 
      results.articles.length + 
      results.strains.length + 
      results.posts.length + 
      results.diaries.length;

    // 3️⃣ AI-GENERIERTE ANTWORT falls wenig Ergebnisse und gewünscht
    let aiAnswer = null;
    
    if (use_ai && totalResults < 3) {
      console.log('🤖 Generating AI answer for query...');
      
      try {
        const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Du bist der Grow Master, ein Cannabis-Anbau-Experte.

Ein Nutzer sucht nach: "${query}"

Es wurden nur wenige direkte Ergebnisse in der Datenbank gefunden. 
Gib eine präzise, hilfreiche Antwort (max. 300 Wörter) auf die Suchanfrage.

Falls du spezifische Artikel, Sorten oder Techniken erwähnst, die in der Datenbank sein könnten, weise darauf hin, dass der Nutzer die Suchbegriffe anpassen kann.`,
          add_context_from_internet: false
        });

        aiAnswer = aiResponse || null;
        
      } catch (aiError) {
        console.warn('AI answer generation failed:', aiError);
      }
    }

    // 4️⃣ RESPONSE
    return Response.json({
      success: true,
      query: query,
      total_results: totalResults,
      results: results,
      ai_answer: aiAnswer,
      suggestions: totalResults === 0 ? [
        'Versuche es mit allgemeineren Begriffen',
        'Prüfe die Schreibweise',
        'Nutze Synonyme oder verwandte Begriffe',
        'Aktiviere "AI-Hilfe" für KI-generierte Antworten'
      ] : []
    });

  } catch (error) {
    console.error('❌ Search failed:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});