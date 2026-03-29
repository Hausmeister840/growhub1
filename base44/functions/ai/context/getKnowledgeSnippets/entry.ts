import { createClientFromRequest } from 'npm:@base44/sdk@0.7.0';

// 📚 KNOWLEDGE CONTEXT PROVIDER - EDUCATIONAL CONTENT INTEGRATION
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let cachedArticles = null;
let cacheTimestamp = 0;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { 
      query,
      category,
      difficulty_level,
      tags,
      limit = 10,
      snippet_length = 300
    } = await req.json();

    console.log('📚 Loading knowledge snippets:', {
      query: query?.substring(0, 50),
      category,
      difficulty_level,
      limit
    });

    // Check cache
    if (cachedArticles && Date.now() - cacheTimestamp < CACHE_TTL) {
      console.log('💾 Using cached knowledge articles');
    } else {
      console.log('🔄 Fetching fresh knowledge articles');
      try {
        cachedArticles = await base44.asServiceRole.entities.KnowledgeArticle.filter(
          { expert_verified: true },
          '-upvotes',
          100
        );
        cacheTimestamp = Date.now();
      } catch (error) {
        console.error('❌ Failed to load knowledge articles:', error);
        return Response.json({
          ok: false,
          error: 'Failed to load knowledge base',
          context: 'Wissensdatenbank nicht verfügbar.'
        });
      }
    }

    if (!Array.isArray(cachedArticles) || cachedArticles.length === 0) {
      return Response.json({
        ok: false,
        error: 'Empty knowledge base',
        context: 'Keine verifizierten Artikel verfügbar.'
      });
    }

    // Filter and rank articles
    let relevantArticles = [...cachedArticles];

    // Category filter
    if (category) {
      relevantArticles = relevantArticles.filter(article => 
        article.category === category
      );
    }

    // Difficulty filter
    if (difficulty_level) {
      relevantArticles = relevantArticles.filter(article => 
        article.difficulty_level === difficulty_level
      );
    }

    // Tag filter
    if (tags && Array.isArray(tags)) {
      relevantArticles = relevantArticles.filter(article => 
        article.tags?.some(tag => 
          tags.some(searchTag => 
            tag.toLowerCase().includes(searchTag.toLowerCase())
          )
        )
      );
    }

    // Text search and relevance scoring
    if (query && query.trim()) {
      const searchTerms = query.toLowerCase().split(/\s+/);
      
      relevantArticles = relevantArticles
        .map(article => ({
          ...article,
          relevance_score: calculateKnowledgeRelevance(article, searchTerms, query)
        }))
        .filter(article => article.relevance_score > 0)
        .sort((a, b) => b.relevance_score - a.relevance_score);
    } else {
      // Sort by upvotes if no query
      relevantArticles = relevantArticles.sort((a, b) => 
        (b.upvotes || 0) - (a.upvotes || 0)
      );
    }

    // Limit results
    const topArticles = relevantArticles.slice(0, limit);

    // Build context with snippets
    const contextText = buildKnowledgeContextText(topArticles, snippet_length);

    console.log(`✅ Knowledge context ready: ${topArticles.length}/${cachedArticles.length} articles`);

    return Response.json({
      ok: true,
      context: contextText,
      article_count: topArticles.length,
      total_available: cachedArticles.length,
      filters_applied: {
        query: query || null,
        category,
        difficulty_level,
        tags
      },
      articles: topArticles.map(article => ({
        id: article.id,
        title: article.title,
        category: article.category,
        difficulty_level: article.difficulty_level,
        upvotes: article.upvotes || 0,
        expert_verified: article.expert_verified,
        relevance_score: article.relevance_score || 0
      }))
    });

  } catch (error) {
    console.error('🚨 Knowledge context error:', error);
    
    return Response.json({
      ok: false,
      error: error.message,
      context: 'Fehler beim Laden der Wissensdatenbank.'
    });
  }
});

function calculateKnowledgeRelevance(article, searchTerms, originalQuery) {
  let score = 0;

  // Title matches (highest weight)
  if (article.title) {
    const titleLower = article.title.toLowerCase();
    searchTerms.forEach(term => {
      if (titleLower.includes(term)) {
        score += 30;
      }
    });
    
    // Exact phrase match in title
    if (titleLower.includes(originalQuery.toLowerCase())) {
      score += 50;
    }
  }

  // Content matches
  if (article.content) {
    const contentLower = article.content.toLowerCase();
    searchTerms.forEach(term => {
      const matches = (contentLower.match(new RegExp(term, 'g')) || []).length;
      score += Math.min(matches * 5, 25); // Cap at 25 points per term
    });
    
    // Exact phrase match in content
    if (contentLower.includes(originalQuery.toLowerCase())) {
      score += 20;
    }
  }

  // Tags matches
  if (article.tags?.length > 0) {
    searchTerms.forEach(term => {
      article.tags.forEach(tag => {
        if (tag.toLowerCase().includes(term)) {
          score += 15;
        }
      });
    });
  }

  // Quality bonuses
  if (article.expert_verified) score += 10;
  if (article.upvotes > 10) score += Math.min(article.upvotes, 20);
  if (article.views_count > 100) score += Math.min(Math.floor(article.views_count / 100), 10);

  // Difficulty relevance (prefer appropriate level)
  if (originalQuery.toLowerCase().includes('anfänger') || originalQuery.toLowerCase().includes('beginner')) {
    if (article.difficulty_level === 'beginner') score += 15;
  } else if (originalQuery.toLowerCase().includes('expert') || originalQuery.toLowerCase().includes('profi')) {
    if (article.difficulty_level === 'advanced') score += 15;
  }

  return Math.round(score);
}

function buildKnowledgeContextText(articles, snippetLength = 300) {
  if (!Array.isArray(articles) || articles.length === 0) {
    return "WARNUNG: Keine relevanten Wissenartikel gefunden.";
  }

  let context = `WISSENSDATENBANK (${articles.length} relevante Artikel):
================================================

`;

  for (const article of articles) {
    context += `📚 "${article.title}"
`;
    context += `   Kategorie: ${article.category || 'allgemein'}`;
    if (article.difficulty_level) {
      context += ` | Niveau: ${article.difficulty_level}`;
    }
    if (article.expert_verified) {
      context += ` | ✅ Expertengeprüft`;
    }
    if (article.upvotes > 0) {
      context += ` | 👍 ${article.upvotes} Upvotes`;
    }
    context += `
`;

    // Add content snippet
    if (article.content) {
      let snippet = article.content;
      
      // Clean up content (remove markdown, excessive whitespace)
      snippet = snippet
        .replace(/[#*`]/g, '') // Remove markdown
        .replace(/\n\s*\n/g, ' ') // Replace multiple newlines
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      if (snippet.length > snippetLength) {
        // Try to cut at sentence boundary
        const sentences = snippet.split(/[.!?]+/);
        let truncated = '';
        
        for (const sentence of sentences) {
          if ((truncated + sentence).length > snippetLength - 20) break;
          truncated += sentence + '. ';
        }
        
        snippet = truncated || snippet.substring(0, snippetLength) + '...';
      }
      
      context += `   Inhalt: ${snippet}
`;
    }

    // Add tags if available
    if (article.tags?.length > 0) {
      context += `   Tags: ${article.tags.slice(0, 5).join(', ')}
`;
    }

    context += `
`;
  }

  context += `
VERWENDUNGSHINWEISE:
- Diese Artikel sind von Experten verifiziert und vertrauenswürdig
- Zitiere relevante Inhalte und verweise auf Artikeltitel
- Bei widersprüchlichen Informationen: bevorzuge höher bewertete Artikel
- Kombiniere Informationen aus mehreren Artikeln für vollständige Antworten`;

  return context;
}