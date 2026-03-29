import { useState, useEffect, useMemo } from 'react';
import { Search, X, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchService from '../services/SearchService';
import { debounce } from 'lodash';

export default function AdvancedSearch({ 
  items = [], 
  onResultClick, 
  placeholder = 'Suchen...',
  filters = []
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isOpen, setIsOpen] = useState(false);

  // Build search index
  useEffect(() => {
    if (items.length > 0) {
      SearchService.buildIndex(items);
    }
  }, [items]);

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((q) => {
      if (q.length < 2) {
        setResults([]);
        return;
      }

      const searchResults = SearchService.search(q);
      
      // Apply filter
      const filtered = activeFilter === 'all' 
        ? searchResults
        : searchResults.filter(r => r.type === activeFilter || r.category === activeFilter);

      setResults(filtered);
    }, 300),
    [activeFilter]
  );

  useEffect(() => {
    debouncedSearch(query);
    return () => debouncedSearch.cancel();
  }, [query, debouncedSearch]);

  const handleQueryChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setShowHistory(false);
    setIsOpen(true);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const handleHistoryClick = (historyQuery) => {
    setQuery(historyQuery);
    setShowHistory(false);
  };

  const searchHistory = SearchService.getHistory();

  return (
    <div className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          onFocus={() => {
            setIsOpen(true);
            if (query.length === 0) setShowHistory(true);
          }}
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        )}
      </div>

      {/* Filters */}
      {filters.length > 0 && isOpen && (
        <div className="flex gap-2 mt-3 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeFilter === 'all'
                ? 'bg-green-500 text-black'
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            Alle
          </button>
          {filters.map(filter => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeFilter === filter.value
                  ? 'bg-green-500 text-black'
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}

      {/* Results Dropdown */}
      <AnimatePresence>
        {isOpen && (query || showHistory) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-96 overflow-y-auto"
          >
            {/* History */}
            {showHistory && searchHistory.length > 0 && (
              <div className="p-3 border-b border-zinc-800">
                <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold mb-2 px-2">
                  <History className="w-4 h-4" />
                  Letzte Suchen
                </div>
                {searchHistory.slice(0, 5).map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleHistoryClick(item)}
                    className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}

            {/* Results */}
            {results.length > 0 && (
              <div className="p-2">
                {results.map((result, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onResultClick?.(result);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className="w-full text-left px-3 py-3 hover:bg-zinc-800 rounded-lg transition-colors flex items-start gap-3"
                  >
                    {result.avatar_url && (
                      <img
                        src={result.avatar_url}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {result.title || result.name || result.content?.substring(0, 50)}
                      </div>
                      {result.username && (
                        <div className="text-xs text-zinc-500">@{result.username}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No Results */}
            {query && results.length === 0 && !showHistory && (
              <div className="p-8 text-center text-zinc-500 text-sm">
                Keine Ergebnisse für "{query}"
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}