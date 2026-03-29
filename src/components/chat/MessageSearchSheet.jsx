import { useState, useRef, useEffect } from 'react';
import { Search, X, ArrowUp, ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MessageSearchSheet({ isOpen, onClose, messages, onJumpToMessage }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const [matchIndex, setMatchIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setMatchIndex(0);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const matches = query.length >= 2
    ? (messages || []).filter(m => m.content?.toLowerCase().includes(query.toLowerCase())).reverse()
    : [];

  const jumpTo = (idx) => {
    if (matches[idx]) {
      setMatchIndex(idx);
      onJumpToMessage?.(matches[idx].id);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -60, opacity: 0 }}
      className="absolute top-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800 px-4 py-3 flex items-center gap-3"
    >
      <Search className="w-4 h-4 text-zinc-500 flex-shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setMatchIndex(0); }}
        placeholder="In Nachrichten suchen..."
        className="flex-1 bg-transparent text-white text-sm placeholder-zinc-500 outline-none"
      />
      {matches.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-zinc-400">
          <span>{matchIndex + 1}/{matches.length}</span>
          <button
            onClick={() => jumpTo(Math.max(0, matchIndex - 1))}
            className="p-1 hover:bg-zinc-800 rounded"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => jumpTo(Math.min(matches.length - 1, matchIndex + 1))}
            className="p-1 hover:bg-zinc-800 rounded"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {query && matches.length === 0 && (
        <span className="text-xs text-zinc-500">Keine Treffer</span>
      )}
      <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 rounded-lg">
        <X className="w-4 h-4 text-zinc-400" />
      </button>
    </motion.div>
  );
}