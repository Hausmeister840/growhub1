
class SemanticSearchEngine {
  constructor() {
    this.embeddings = new Map();
    this.indexedPosts = new Set();
  }

  // Generate embedding for content
  async generateEmbedding(text) {
    // Simulate embedding generation (in production use OpenAI embeddings or similar)
    const words = text.toLowerCase().split(/\s+/);
    const vector = new Array(384).fill(0);
    
    words.forEach((word, idx) => {
      const hash = this.hashString(word);
      vector[hash % 384] += 1;
    });

    // Normalize
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map(val => val / magnitude);
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  // Index a post
  async indexPost(post) {
    if (this.indexedPosts.has(post.id)) return;

    const text = `${post.content || ''} ${post.tags?.join(' ') || ''}`;
    const embedding = await this.generateEmbedding(text);
    
    this.embeddings.set(post.id, {
      vector: embedding,
      metadata: {
        title: post.content?.slice(0, 50),
        tags: post.tags,
        author: post.created_by,
        date: post.created_date
      }
    });

    this.indexedPosts.add(post.id);
  }

  // Semantic search
  async search(query, posts, limit = 10) {
    const queryEmbedding = await this.generateEmbedding(query);
    
    // Calculate cosine similarity
    const scores = [];
    
    for (const post of posts) {
      await this.indexPost(post);
      const postEmbedding = this.embeddings.get(post.id);
      
      if (postEmbedding) {
        const similarity = this.cosineSimilarity(queryEmbedding, postEmbedding.vector);
        scores.push({ post, similarity });
      }
    }

    // Sort by similarity
    scores.sort((a, b) => b.similarity - a.similarity);
    
    return scores.slice(0, limit).map(s => s.post);
  }

  cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
    }
    return dotProduct; // Already normalized vectors
  }

  // Find similar posts
  async findSimilar(postId, allPosts, limit = 5) {
    const targetEmbedding = this.embeddings.get(postId);
    if (!targetEmbedding) return [];

    const similarities = [];
    
    for (const post of allPosts) {
      if (post.id === postId) continue;
      
      await this.indexPost(post);
      const embedding = this.embeddings.get(post.id);
      
      if (embedding) {
        const similarity = this.cosineSimilarity(targetEmbedding.vector, embedding.vector);
        similarities.push({ post, similarity });
      }
    }

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(s => s.post);
  }
}

export const semanticSearch = new SemanticSearchEngine();