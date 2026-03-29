import { useState, useCallback } from 'react';
import { Search, X, TrendingUp, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function FeedSearch({ onSearch, trendingTags = [] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');

  const handleSearch = useCallback((searchQuery) => {
    setQuery(searchQuery);
    onSearch?.(searchQuery);
  }, [onSearch]);

  const handleTagClick = (tag) => {
    handleSearch(`#${tag}`);
    setIsExpanded(false);
  };

  return (
    <div className="relative">
      <motion.div
        initial={false}
        animate={{ width: isExpanded ? '100%' : 'auto' }}
        className="flex items-center gap-2"
      >
        {!isExpanded ? (
          <Button
            onClick={() => setIsExpanded(true)}
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white"
          >
            <Search className="w-5 h-5" />
          </Button>
        ) : (
          <div className="flex items-center gap-2 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Suche Posts, User, Tags..."
                className="pl-10 bg-zinc-900 border-zinc-800"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => handleSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button
              onClick={() => {
                setIsExpanded(false);
                handleSearch('');
              }}
              variant="ghost"
              size="icon"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {isExpanded && !query && trendingTags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 left-0 right-0 bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xl z-50"
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm font-semibold text-white">Trending Tags</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {trendingTags.slice(0, 10).map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-full text-sm text-zinc-300 hover:text-white transition-all"
                >
                  <Hash className="w-3 h-3" />
                  {tag}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}