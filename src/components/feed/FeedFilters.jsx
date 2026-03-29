import { Filter, Image, Video, MessageSquare, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const FILTER_OPTIONS = [
  { id: 'all', label: 'Alle', icon: Filter },
  { id: 'images', label: 'Bilder', icon: Image },
  { id: 'videos', label: 'Videos', icon: Video },
  { id: 'text', label: 'Text', icon: MessageSquare },
  { id: 'today', label: 'Heute', icon: Calendar }
];

export default function FeedFilters({ activeFilter, onFilterChange }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-2">
      {FILTER_OPTIONS.map(filter => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.id;
        
        return (
          <motion.button
            key={filter.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onFilterChange(filter.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              isActive
                ? 'bg-green-500 text-white'
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            {filter.label}
          </motion.button>
        );
      })}
    </div>
  );
}