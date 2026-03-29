import { useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, X, Check, TrendingUp, Clock, Sparkles, Users, Image, Video, FileText, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdvancedFilters({ filters, onFiltersChange, onClose }) {
  const [localFilters, setLocalFilters] = useState(filters);

  const contentTypes = [
    { value: 'all', label: 'Alle', icon: Sparkles },
    { value: 'image', label: 'Bilder', icon: Image },
    { value: 'video', label: 'Videos', icon: Video },
    { value: 'text', label: 'Text', icon: FileText }
  ];

  const categories = [
    { value: 'all', label: 'Alle Kategorien' },
    { value: 'general', label: 'Allgemein' },
    { value: 'grow_diary', label: 'Grow Diaries' },
    { value: 'strain_review', label: 'Strain Reviews' },
    { value: 'education', label: 'Bildung' },
    { value: 'product', label: 'Produkte' },
    { value: 'event', label: 'Events' }
  ];

  const timeRanges = [
    { value: 'all', label: 'Alle Zeit', icon: Calendar },
    { value: '1h', label: 'Letzte Stunde', icon: Clock },
    { value: '24h', label: 'Letzte 24h', icon: Clock },
    { value: '7d', label: 'Letzte 7 Tage', icon: Clock },
    { value: '30d', label: 'Letzte 30 Tage', icon: Clock }
  ];

  const sortOptions = [
    { value: 'ai', label: 'KI-Empfohlen', icon: Sparkles },
    { value: 'trending', label: 'Trending', icon: TrendingUp },
    { value: 'recent', label: 'Neueste', icon: Clock },
    { value: 'popular', label: 'Beliebt', icon: Users }
  ];

  const updateFilter = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const resetFilters = () => {
    const defaultFilters = {
      contentType: 'all',
      category: 'all',
      timeRange: 'all',
      sortBy: 'ai',
      onlyFollowing: false,
      hasMedia: false,
      minEngagement: 0
    };
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end lg:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-900 w-full lg:max-w-2xl lg:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-green-400" />
            <h2 className="text-xl font-bold text-white">Erweiterte Filter</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Sort By */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-400 mb-3">Sortierung</h3>
            <div className="grid grid-cols-2 gap-3">
              {sortOptions.map(option => {
                const Icon = option.icon;
                const isActive = localFilters.sortBy === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => updateFilter('sortBy', option.value)}
                    className={`p-4 rounded-2xl border transition-all ${
                      isActive
                        ? 'bg-green-500/20 border-green-500/50 text-green-400'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <Icon className="w-5 h-5 mx-auto mb-2" />
                    <p className="text-sm font-medium">{option.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Type */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-400 mb-3">Content-Typ</h3>
            <div className="grid grid-cols-2 gap-3">
              {contentTypes.map(type => {
                const Icon = type.icon;
                const isActive = localFilters.contentType === type.value;
                return (
                  <button
                    key={type.value}
                    onClick={() => updateFilter('contentType', type.value)}
                    className={`p-4 rounded-2xl border transition-all ${
                      isActive
                        ? 'bg-green-500/20 border-green-500/50 text-green-400'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <Icon className="w-5 h-5 mx-auto mb-2" />
                    <p className="text-sm font-medium">{type.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-400 mb-3">Kategorie</h3>
            <select
              value={localFilters.category}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Time Range */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-400 mb-3">Zeitraum</h3>
            <div className="space-y-2">
              {timeRanges.map(range => {
                const Icon = range.icon;
                const isActive = localFilters.timeRange === range.value;
                return (
                  <button
                    key={range.value}
                    onClick={() => updateFilter('timeRange', range.value)}
                    className={`w-full p-3 rounded-xl border transition-all flex items-center gap-3 ${
                      isActive
                        ? 'bg-green-500/20 border-green-500/50 text-green-400'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium flex-1 text-left">{range.label}</span>
                    {isActive && <Check className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggle Options */}
          <div className="space-y-3">
            <label className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
              <span className="text-sm font-medium text-white">Nur von Accounts, denen ich folge</span>
              <input
                type="checkbox"
                checked={localFilters.onlyFollowing}
                onChange={(e) => updateFilter('onlyFollowing', e.target.checked)}
                className="w-5 h-5 rounded accent-green-500"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
              <span className="text-sm font-medium text-white">Nur Posts mit Medien</span>
              <input
                type="checkbox"
                checked={localFilters.hasMedia}
                onChange={(e) => updateFilter('hasMedia', e.target.checked)}
                className="w-5 h-5 rounded accent-green-500"
              />
            </label>
          </div>

          {/* Engagement Filter */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-400 mb-3">
              Min. Engagement: {localFilters.minEngagement}
            </h3>
            <input
              type="range"
              min="0"
              max="100"
              value={localFilters.minEngagement}
              onChange={(e) => updateFilter('minEngagement', parseInt(e.target.value))}
              className="w-full accent-green-500"
            />
            <div className="flex justify-between text-xs text-zinc-500 mt-1">
              <span>Alle</span>
              <span>Hoch</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-zinc-900 border-t border-white/10 p-6 flex gap-3">
          <Button
            onClick={resetFilters}
            variant="outline"
            className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            Zurücksetzen
          </Button>
          <Button
            onClick={applyFilters}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-black font-semibold hover:from-green-600 hover:to-emerald-600"
          >
            Anwenden
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}