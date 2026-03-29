// Central orchestrator for all 2030 feed features
import { neuralOptimizer } from './NeuralFeedOptimizer';
import { temporalAnalyzer } from './TemporalFeedAnalyzer';
import { attentionTracker } from './AttentionEconomyTracker';
import { quantumCache } from './QuantumCacheLayer';
import { recommendationEngine } from './ContentRecommendationEngine';
import { edgeComputing } from './EdgeComputingSimulator';
import { semanticSearch } from './SemanticSearchEngine';

class FeedOrchestrator {
  constructor() {
    this.initialized = false;
    this.userContext = null;
  }

  async initialize(user) {
    if (this.initialized) return;

    try {
      this.userContext = {
        userId: user.id,
        email: user.email,
        interests: {},
        following: user.following || [],
        preferences: {
          quality: 'auto',
          voice: false,
          haptic: true
        }
      };

      // Initialize all systems
      console.log('🚀 Initializing Future Feed Systems...');
      
      // Initialize neural optimizer
      if (neuralOptimizer?.updateProfile) {
        neuralOptimizer.updateProfile(this.userContext);
      }
      
      // Clean up caches
      if (quantumCache?.cleanup) {
        quantumCache.cleanup();
      }
      
      this.initialized = true;
      console.log('✅ All systems ready');
    } catch (err) {
      console.error('Feed orchestrator init failed:', err);
      this.initialized = false;
    }
  }

  // Process incoming posts through all systems
  async processPosts(posts) {
    if (!posts || posts.length === 0) return [];

    const processed = [];

    for (const post of posts) {
      try {
        // 1. Check quantum cache
        const cached = quantumCache?.get?.(`post:${post.id}`);
        if (cached) {
          processed.push(cached);
          continue;
        }

        // 2. Process at edge
        let optimized = post;
        if (edgeComputing?.processAtEdge) {
          optimized = await edgeComputing.processAtEdge(post, 'content_category');
        }

        // 3. Calculate neural score
        let neuralScore = 0;
        if (neuralOptimizer?.calculateScore) {
          neuralScore = neuralOptimizer.calculateScore(post, this.userContext);
        }

        // 4. Add to semantic index
        if (semanticSearch?.indexPost) {
          await semanticSearch.indexPost(post);
        }

        // 5. Cache with prediction
        const enhanced = {
          ...post,
          ...optimized,
          neuralScore,
          processed_at: new Date().toISOString()
        };

        if (quantumCache?.set) {
          quantumCache.set(`post:${post.id}`, enhanced, 600000, 0.9);
        }
        
        processed.push(enhanced);
      } catch (err) {
        console.warn('Post processing failed:', err);
        processed.push(post);
      }
    }

    return processed;
  }

  // Get optimized feed
  async getOptimizedFeed(posts, options = {}) {
    const { 
      mood = null, 
      filters = {}, 
      layout = 'cards',
      timePeriod = 'now'
    } = options;

    // 1. Process all posts
    let processed = await this.processPosts(posts);

    // 2. Apply temporal analysis
    const activityLevel = temporalAnalyzer.getCurrentActivityLevel();
    if (activityLevel < 0.3) {
      // User is in low-activity period, show best content only
      processed = processed.filter(p => p.neuralScore > 70);
    }

    // 3. Apply neural optimization
    processed = await neuralOptimizer.optimizeFeed(processed, this.userContext);

    // 4. Apply recommendation engine
    if (mood) {
      processed = processed.filter(p => {
        if (mood === 'energetic') return p.type === 'video';
        if (mood === 'calm') return p.type === 'image';
        return true;
      });
    }

    return processed;
  }

  // Record user interaction
  recordInteraction(post, action, duration = 0) {
    try {
      // Track in multiple systems
      if (attentionTracker?.recordInteraction) {
        attentionTracker.recordInteraction(post.id, action);
      }
      
      if (temporalAnalyzer?.recordInteraction) {
        temporalAnalyzer.recordInteraction(new Date(), post.type);
      }
      
      // Learn from interaction
      if (neuralOptimizer?.learn) {
        neuralOptimizer.learn({
          action,
          post,
          duration
        });
      }
    } catch (err) {
      console.warn('Interaction tracking failed:', err);
    }
  }

  // Predict next content
  async predictNext(recentViews) {
    return await recommendationEngine.predictNext(recentViews);
  }

  // Get system stats
  getStats() {
    try {
      return {
        attention: attentionTracker?.getStats?.() || {},
        cache: quantumCache?.getAnalytics?.() || {},
        edge: edgeComputing?.getMetrics?.() || {},
        temporal: temporalAnalyzer?.export?.() || {},
        neural: neuralOptimizer?.getProfile?.() || {}
      };
    } catch (err) {
      console.warn('Stats retrieval failed:', err);
      return {};
    }
  }

  // Cleanup
  destroy() {
    try {
      if (quantumCache?.clear) {
        quantumCache.clear();
      }
      if (attentionTracker?.reset) {
        attentionTracker.reset();
      }
      this.initialized = false;
    } catch (err) {
      console.warn('Cleanup failed:', err);
    }
  }
}

export const feedOrchestrator = new FeedOrchestrator();

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    feedOrchestrator.destroy();
  });
}