import { useEffect, useRef } from 'react';
import { recommendationEngine } from './ContentRecommendationEngine';

export default function PredictiveContentPrefetcher({ posts, currentUser, enabled = true }) {
  const prefetchedIds = useRef(new Set());
  const viewHistory = useRef([]);

  useEffect(() => {
    if (!enabled || !currentUser || posts.length === 0) return;

    const prefetchNext = async () => {
      // Get user's recent viewing pattern
      const recentViews = viewHistory.current.slice(-10);
      
      // Predict what they want next
      const prediction = await recommendationEngine.predictNext(recentViews);
      
      if (!prediction) return;

      // Find posts matching prediction
      const matchingPosts = posts.filter(post => {
        if (!post.tags) return false;
        
        return prediction.predicted_topics?.some(topic => 
          post.tags.some(tag => tag.toLowerCase().includes(topic.toLowerCase()))
        ) || prediction.predicted_content_types?.includes(post.type);
      });

      // Prefetch top 5
      matchingPosts.slice(0, 5).forEach(post => {
        if (prefetchedIds.current.has(post.id)) return;

        // Prefetch media
        post.media_urls?.forEach(url => {
          if (!url) return;
          
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = url;
          link.as = url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' : 'fetch';
          document.head.appendChild(link);
          
          prefetchedIds.current.add(post.id);
        });
      });
    };

    const debounce = setTimeout(prefetchNext, 1000);
    return () => clearTimeout(debounce);
  }, [posts, currentUser, enabled]);

  // Track views
  useEffect(() => {
    const handleScroll = () => {
      const viewportHeight = window.innerHeight;
      const scrollY = window.scrollY;
      
      // Find posts in viewport
      posts.forEach((post, idx) => {
        const postElement = document.querySelector(`[data-post-id="${post.id}"]`);
        if (!postElement) return;

        const rect = postElement.getBoundingClientRect();
        const inViewport = rect.top < viewportHeight && rect.bottom > 0;

        if (inViewport && !viewHistory.current.find(v => v.id === post.id)) {
          viewHistory.current.push({
            id: post.id,
            category: post.category,
            type: post.type,
            tags: post.tags,
            timestamp: Date.now()
          });

          // Keep only last 50 views
          if (viewHistory.current.length > 50) {
            viewHistory.current.shift();
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [posts]);

  return null;
}