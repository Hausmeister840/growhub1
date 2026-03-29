import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  Search, Sparkles, BookOpen, Leaf, Zap,
  TrendingUp, Award, Clock, Eye, ArrowRight, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const CATEGORIES = [
  { key: 'all', label: 'Alle', icon: Sparkles, color: 'from-purple-500 to-pink-500' },
  { key: 'growing', label: 'Anbau', icon: Leaf, color: 'from-green-500 to-emerald-500' },
  { key: 'strains', label: 'Sorten', icon: Zap, color: 'from-yellow-500 to-orange-500' },
  { key: 'equipment', label: 'Equipment', icon: Award, color: 'from-blue-500 to-cyan-500' },
  { key: 'troubleshooting', label: 'Probleme', icon: TrendingUp, color: 'from-red-500 to-pink-500' }
];

const DIFFICULTIES = [
  { key: 'all', label: 'Alle Level' },
  { key: 'beginner', label: 'Anfänger', emoji: '🌱' },
  { key: 'intermediate', label: 'Fortgeschritten', emoji: '🌿' },
  { key: 'advanced', label: 'Experte', emoji: '🏆' }
];

export default function Knowledge() {
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [recentArticles, setRecentArticles] = useState([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    const initUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        setCurrentUser(null);
      }
    };

    initUser();
  }, []);

  useEffect(() => {
    const loadArticles = async () => {
      setIsLoadingFeatured(true);
      try {
        const [featured, recent] = await Promise.all([
          base44.entities.KnowledgeArticle.filter({ featured: true }).catch(() => []),
          base44.entities.KnowledgeArticle.list('-created_date', 12).catch(() => [])
        ]);
        
        setFeaturedArticles(featured.slice(0, 3));
        setRecentArticles(recent);
      } catch (error) {
        console.error('Failed to load articles:', error);
      } finally {
        setIsLoadingFeatured(false);
      }
    };

    loadArticles();
  }, []);

  const handleArticleClick = (articleId) => {
    navigate(createPageUrl(`ArticleDetail?id=${articleId}`));
  };

  const filteredRecentArticles = recentArticles.filter(article => {
    const categoryMatch = selectedCategory === 'all' || article.category === selectedCategory;
    const difficultyMatch = selectedDifficulty === 'all' || article.difficulty_level === selectedDifficulty;
    const searchMatch = !searchQuery || 
      article.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content?.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && difficultyMatch && searchMatch;
  });

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="sticky top-14 lg:top-0 z-20 bg-black/95 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
              Wissen
            </h1>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Durchsuche Artikel..."
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-12 pr-12 py-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
            />
            
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Category Filter */}
          <div className="mb-8 overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 pb-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                    selectedCategory === cat.key
                      ? 'bg-gradient-to-r ' + cat.color + ' text-white shadow-lg'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <cat.icon className="w-4 h-4" />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Filter */}
          <div className="mb-8 flex gap-2 flex-wrap">
            {DIFFICULTIES.map((diff) => (
              <button
                key={diff.key}
                onClick={() => setSelectedDifficulty(diff.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedDifficulty === diff.key
                    ? 'bg-green-500/20 border border-green-500/30 text-green-300'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {diff.emoji && <span className="mr-1">{diff.emoji}</span>}
                {diff.label}
              </button>
            ))}
          </div>

          {/* Featured Articles */}
          {isLoadingFeatured ? (
            <div className="grid gap-6 md:grid-cols-3 mb-12">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-zinc-900/50 rounded-3xl p-6 border border-zinc-800 animate-pulse h-48" />
              ))}
            </div>
          ) : (
            featuredArticles.length > 0 && selectedCategory === 'all' && selectedDifficulty === 'all' && !searchQuery && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                  Empfohlen
                </h2>
                <div className="grid gap-6 md:grid-cols-3">
                  {featuredArticles.map((article, index) => (
                    <FeaturedArticleCard
                      key={article.id}
                      article={article}
                      index={index}
                      onClick={() => handleArticleClick(article.id)}
                    />
                  ))}
                </div>
              </div>
            )
          )}

          {/* Recent Articles */}
          <div>
            <h2 className="text-2xl font-bold mb-6">
              {selectedCategory !== 'all' 
                ? CATEGORIES.find(c => c.key === selectedCategory)?.label 
                : 'Alle Artikel'}
            </h2>
            
            {filteredRecentArticles.length === 0 ? (
              <div className="text-center py-16 bg-zinc-900/50 rounded-3xl border border-zinc-800">
                <BookOpen className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Keine Artikel gefunden</h3>
                <p className="text-zinc-400 mb-6">
                  {searchQuery ? 'Keine passenden Artikel' : 'Versuche andere Filter'}
                </p>
                <Button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedDifficulty('all');
                    setSearchQuery('');
                  }}
                  variant="outline"
                >
                  Filter zurücksetzen
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredRecentArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onClick={() => handleArticleClick(article.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeaturedArticleCard({ article, index, onClick }) {
  const gradients = [
    'from-purple-500/20 to-pink-500/20',
    'from-blue-500/20 to-cyan-500/20',
    'from-green-500/20 to-emerald-500/20'
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={onClick}
      className={`bg-zinc-900/50 rounded-3xl p-6 border border-zinc-800 cursor-pointer hover:border-green-500/30 transition-all group bg-gradient-to-br ${gradients[index % 3]}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="px-3 py-1 rounded-full bg-black/50 text-xs font-bold text-yellow-400 border border-yellow-400/20">
          ⭐ Featured
        </div>
        <Eye className="w-4 h-4 text-zinc-500" />
      </div>

      <h3 className="text-xl font-bold mb-2 text-white group-hover:text-green-400 transition-colors line-clamp-2">
        {article.title}
      </h3>

      <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
        {article.content?.substring(0, 100)}...
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Clock className="w-3 h-3" />
          {article.read_time_minutes || 5} min
        </div>

        <ArrowRight className="w-5 h-5 text-zinc-500 group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
      </div>
    </motion.div>
  );
}

function ArticleCard({ article, onClick }) {
  const categoryColors = {
    growing: 'text-green-400 bg-green-500/10',
    strains: 'text-yellow-400 bg-yellow-500/10',
    equipment: 'text-blue-400 bg-blue-500/10',
    troubleshooting: 'text-red-400 bg-red-500/10',
    legal: 'text-purple-400 bg-purple-500/10',
    medical: 'text-pink-400 bg-pink-500/10'
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="bg-zinc-900/50 rounded-2xl p-5 border border-zinc-800 cursor-pointer hover:border-green-500/30 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${categoryColors[article.category] || 'text-zinc-400 bg-zinc-800'}`}>
          {article.category}
        </span>
        {article.difficulty_level && (
          <span className="text-xs text-zinc-500">
            {article.difficulty_level === 'beginner' && '🌱'}
            {article.difficulty_level === 'intermediate' && '🌿'}
            {article.difficulty_level === 'advanced' && '🏆'}
          </span>
        )}
      </div>

      <h3 className="font-bold text-white group-hover:text-green-400 transition-colors line-clamp-2 mb-2">
        {article.title}
      </h3>

      <p className="text-sm text-zinc-400 line-clamp-2 mb-4">
        {article.content?.substring(0, 150)}
      </p>

      <div className="flex items-center justify-between text-xs text-zinc-500">
        <div className="flex items-center gap-3">
          {article.views_count > 0 && (
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {article.views_count}
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {article.read_time_minutes || 5} min
          </div>
        </div>

        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </motion.div>
  );
}