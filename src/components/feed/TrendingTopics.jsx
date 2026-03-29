import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Flame, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TrendingTopics() {
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadTrendingTopics();
    const interval = setInterval(loadTrendingTopics, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const loadTrendingTopics = async () => {
    try {
      const posts = await base44.entities.Post.list('-created_date', 200);
      
      // Only posts from last 24h
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      const recentPosts = posts.filter(p => 
        new Date(p.created_date).getTime() > oneDayAgo &&
        p.status === 'published'
      );

      // Count tag occurrences with engagement weight
      const tagScores = {};
      recentPosts.forEach(post => {
        const engagement = calculateEngagement(post);
        (post.tags || []).forEach(tag => {
          const normalized = tag.toLowerCase().trim();
          if (normalized) {
            tagScores[normalized] = (tagScores[normalized] || 0) + (1 + engagement);
          }
        });
      });

      // Sort and take top 5
      const trending = Object.entries(tagScores)
        .map(([tag, score]) => ({ tag, score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      setTopics(trending);
    } catch (error) {
      console.error('Failed to load trending topics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateEngagement = (post) => {
    const reactions = Object.values(post.reactions || {})
      .reduce((sum, r) => sum + (r.count || 0), 0);
    const comments = post.comments_count || 0;
    const views = post.view_count || 1;
    return ((reactions * 2) + (comments * 3)) / views;
  };

  const handleTopicClick = (tag) => {
    navigate(`${createPageUrl('Feed')}?tag=${encodeURIComponent(tag)}`);
  };

  if (isLoading || topics.length === 0) return null;

  return (
    <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-orange-500" />
        <h3 className="text-white font-semibold">Trending Topics</h3>
      </div>

      <div className="space-y-2">
        {topics.map((topic, idx) => (
          <motion.button
            key={topic.tag}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => handleTopicClick(topic.tag)}
            className="w-full flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors group"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-orange-500/20 rounded-lg">
              <span className="text-orange-400 font-bold text-sm">#{idx + 1}</span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-medium text-sm group-hover:text-green-400 transition-colors">
                #{topic.tag}
              </p>
              <p className="text-zinc-500 text-xs">
                {Math.round(topic.score)} Interaktionen
              </p>
            </div>
            <TrendingUp className="w-4 h-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}