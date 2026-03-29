import { base44 } from '@/api/base44Client';

class AIContentModerator {
  constructor() {
    this.cache = new Map();
  }

  // Analyze content for moderation
  async analyze(content, media_urls = []) {
    const cacheKey = this.getCacheKey(content, media_urls);
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analysiere diesen Social Media Content auf:
1. Unangemessene Inhalte
2. Spam
3. Hassrede
4. Fehlinformationen
5. Gewalt

Content: ${content}

Gib eine detaillierte Analyse mit Empfehlung.`,
        response_json_schema: {
          type: "object",
          properties: {
            safe: { type: "boolean" },
            confidence: { type: "number" },
            issues: {
              type: "array",
              items: { type: "string" }
            },
            action: {
              type: "string",
              enum: ["approve", "review", "flag", "remove"]
            },
            reason: { type: "string" }
          }
        }
      });

      this.cache.set(cacheKey, response);
      
      // Auto-expire cache after 1 hour
      setTimeout(() => this.cache.delete(cacheKey), 3600000);

      return response;
    } catch (error) {
      console.error('Moderation analysis failed:', error);
      return {
        safe: true,
        confidence: 0.5,
        issues: [],
        action: 'review',
        reason: 'Analysis failed - manual review recommended'
      };
    }
  }

  getCacheKey(content, media_urls) {
    return `${content}-${media_urls.join(',')}`;
  }

  // Check if content needs review
  needsReview(analysis) {
    return (
      !analysis.safe ||
      analysis.confidence < 0.8 ||
      analysis.issues.length > 0 ||
      analysis.action === 'review'
    );
  }

  // Get severity level
  getSeverity(analysis) {
    if (analysis.action === 'remove') return 'critical';
    if (analysis.action === 'flag') return 'high';
    if (analysis.action === 'review') return 'medium';
    return 'low';
  }
}

export const aiModerator = new AIContentModerator();