import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Camera, BookOpen, Sparkles, MapPin } from 'lucide-react';

const actions = [
  { icon: Camera, label: 'Plant Scan', page: 'PlantScan', color: 'from-green-500 to-emerald-600', emoji: '📸' },
  { icon: BookOpen, label: 'Growpedia', page: 'Strains', color: 'from-purple-500 to-violet-600', emoji: '📖' },
  { icon: Sparkles, label: 'AI Coach', page: 'Help', color: 'from-blue-500 to-cyan-600', emoji: '🤖' },
  { icon: MapPin, label: 'Radar', page: 'Map', color: 'from-orange-500 to-red-600', emoji: '📍' }
];

export default function GrowQuickActions() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map((action, i) => (
        <Link key={action.page} to={createPageUrl(action.page)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="flex flex-col items-center gap-1.5"
          >
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center text-2xl shadow-lg`}>
              {action.emoji}
            </div>
            <span className="text-[10px] text-zinc-400 font-medium">{action.label}</span>
          </motion.div>
        </Link>
      ))}
    </div>
  );
}