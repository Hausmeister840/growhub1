import { motion } from 'framer-motion';
import { Navigation } from 'lucide-react';

const QUICK_TYPES = [
  { key: 'cannabis_social_club', icon: '🌿', label: 'Club' },
  { key: 'apotheke', icon: '💊', label: 'Apotheke' },
  { key: 'grow_shop', icon: '🌱', label: 'Grow Shop' },
  { key: 'dispensary', icon: '🏪', label: 'Dispensary' },
  { key: 'doctor', icon: '⚕️', label: 'Arzt' },
];

export default function QuickAccessBar({ clubs, userLocation, onNavigate }) {
  if (!userLocation) return null;

  const calcDist = (a, b) => {
    const R = 6371000;
    const dLat = (b.latitude - a.lat) * Math.PI / 180;
    const dLng = (b.longitude - a.lng) * Math.PI / 180;
    const x = Math.sin(dLat/2)**2 + Math.cos(a.lat*Math.PI/180)*Math.cos(b.latitude*Math.PI/180)*Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
  };

  const findNearest = (type) => {
    const filtered = clubs.filter(c => c.club_type === type);
    if (!filtered.length) return null;
    return filtered.reduce((best, c) => {
      const d = calcDist(userLocation, c);
      return !best || d < best.dist ? { ...c, dist: d } : best;
    }, null);
  };

  return (
    <div className="fixed bottom-24 lg:bottom-6 left-4 z-[999] flex flex-col gap-2">
      {QUICK_TYPES.map(type => {
        const nearest = findNearest(type.key);
        if (!nearest) return null;
        const distStr = nearest.dist < 1000 ? `${Math.round(nearest.dist)}m` : `${(nearest.dist/1000).toFixed(1)}km`;
        return (
          <motion.button
            key={type.key}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate(nearest)}
            className="flex items-center gap-2 pl-2.5 pr-3 py-2 rounded-2xl bg-black/70 backdrop-blur-xl border border-white/[0.1] shadow-lg hover:border-green-500/30 transition-all group"
          >
            <span className="text-base">{type.icon}</span>
            <div className="text-left">
              <p className="text-[10px] text-zinc-500 font-medium leading-none">{type.label}</p>
              <p className="text-xs text-white font-bold leading-tight">{distStr}</p>
            </div>
            <Navigation className="w-3 h-3 text-green-500/60 group-hover:text-green-400 ml-1" />
          </motion.button>
        );
      })}
    </div>
  );
}