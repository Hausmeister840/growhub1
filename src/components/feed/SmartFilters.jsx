import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Image, Video, FileText, ChevronDown } from 'lucide-react';

export default function SmartFilters({ activeFilters, onFiltersChange }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const mediaTypes = [
    { id: 'image', label: 'Bilder', icon: Image },
    { id: 'video', label: 'Videos', icon: Video },
    { id: 'text', label: 'Text', icon: FileText }
  ];

  const toggleFilter = (type, value) => {
    const newFilters = { ...activeFilters };
    if (newFilters[type] === value) {
      delete newFilters[type];
    } else {
      newFilters[type] = value;
    }
    onFiltersChange(newFilters);
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  return (
    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-white/80 hover:text-white transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-green-400" />
          <span className="text-sm font-semibold">Smart Filter</span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
              {Object.keys(activeFilters).length}
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-3 border-t border-white/5">
              <div>
                <p className="text-xs text-zinc-500 mb-2">Medientyp</p>
                <div className="flex flex-wrap gap-2">
                  {mediaTypes.map((type) => {
                    const Icon = type.icon;
                    const isActive = activeFilters.mediaType === type.id;
                    
                    return (
                      <motion.button
                        key={type.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleFilter('mediaType', type.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/10'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {type.label}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={() => onFiltersChange({})}
                  className="w-full py-2 text-xs text-zinc-500 hover:text-white transition-colors"
                >
                  Filter zurücksetzen
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}