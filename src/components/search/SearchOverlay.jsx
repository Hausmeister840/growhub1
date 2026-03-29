import { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Search, X, Hash, FileText, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDisplayName, getInitials } from '@/components/utils/terminology';
import { motion, AnimatePresence } from 'framer-motion';
import { globalSearch } from './searchService';

const DEBOUNCE_MS = 300;

export default function SearchOverlay({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ posts: [], users: [], tags: [] });
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  // Auto-focus on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults({ posts: [], users: [], tags: [] });
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Close on route change
  useEffect(() => {
    window.addEventListener('routeChange', onClose);
    return () => window.removeEventListener('routeChange', onClose);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  const performSearch = useCallback(async (searchTerm) => {
    const trimmed = searchTerm.trim();
    if (!trimmed || trimmed.length < 2) {
      setResults({ posts: [], users: [], tags: [] });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const data = await globalSearch(trimmed);
    setResults(data);
    setIsSearching(false);
  }, []);

  const handleInputChange = useCallback((e) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(val), DEBOUNCE_MS);
  }, [performSearch]);

  const go = (path) => { navigate(path); onClose(); };

  const hasResults = results.posts.length > 0 || results.users.length > 0 || results.tags.length > 0;
  const showResults = query.trim().length >= 2;

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] flex items-start justify-center bg-black/90"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.97 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-xl mx-4 mt-[10vh] sm:mt-[15vh] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/60">
            <Search className="w-5 h-5 text-zinc-500 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              placeholder="Suche Posts, @user oder #tag..."
              className="flex-1 bg-transparent text-white text-base placeholder:text-zinc-500 focus:outline-none"
              autoComplete="off"
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setResults({ posts: [], users: [], tags: [] }); inputRef.current?.focus(); }}
                className="p-1 rounded-full hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            )}
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {!showResults ? (
              <div className="py-10 text-center">
                <Search className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">Tippe mindestens 2 Zeichen ein</p>
              </div>
            ) : isSearching ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
              </div>
            ) : !hasResults ? (
              <div className="py-10 text-center">
                <p className="text-zinc-400 text-sm">Keine Ergebnisse für „{query}"</p>
                <p className="text-zinc-600 text-xs mt-1">Versuche andere Suchbegriffe</p>
              </div>
            ) : (
              <div className="py-2">
                {/* Tags */}
                {results.tags.length > 0 && (
                  <div className="px-4 pb-3">
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-2">Hashtags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {results.tags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => go(`/Feed?tag=${encodeURIComponent(tag)}`)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-xs hover:bg-green-500/20 transition-colors"
                        >
                          <Hash className="w-3 h-3" />
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Users */}
                {results.users.length > 0 && (
                  <div className="border-t border-zinc-800/60 px-3 pt-2 pb-1">
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1.5 px-1">Nutzer</p>
                    {results.users.map(u => (
                      <button
                        key={u.id}
                        onClick={() => go(`/Profile?id=${u.id}`)}
                        className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-zinc-800 transition-colors text-left group"
                      >
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {getInitials(u)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-white truncate">{getDisplayName(u)}</p>
                          {u.username && <p className="text-xs text-zinc-500 truncate">@{u.username}</p>}
                        </div>
                        <ArrowRight className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Posts */}
                {results.posts.length > 0 && (
                  <div className="border-t border-zinc-800/60 px-3 pt-2 pb-1">
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1.5 px-1">Beiträge</p>
                    {results.posts.map(p => (
                      <button
                        key={p.id}
                        onClick={() => go(`/PostThread?id=${p.id}`)}
                        className="w-full flex items-start gap-3 px-2 py-2.5 rounded-xl hover:bg-zinc-800 transition-colors text-left group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FileText className="w-4 h-4 text-zinc-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-zinc-200 line-clamp-2 leading-snug">
                            {p.content?.slice(0, 120)}{p.content?.length > 120 ? '…' : ''}
                          </p>
                          {p.tags?.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {p.tags.slice(0, 3).map(t => (
                                <span key={t} className="text-[10px] text-green-500">#{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        {p.media_urls?.[0] && (
                          <img src={p.media_urls[0]} alt="" className="w-11 h-11 rounded-lg object-cover flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Keyboard hint */}
          <div className="hidden sm:flex items-center justify-center gap-2 py-2 border-t border-zinc-800/60 text-xs text-zinc-600">
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-500 font-mono text-[10px]">ESC</kbd>
            <span>zum Schließen</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}