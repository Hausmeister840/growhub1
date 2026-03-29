import { motion } from 'framer-motion';
import { MapPin, CheckCircle, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function LocationList({ locations = [], zones = [], onSelectLocation, isMobile }) {
  const allItems = [...locations, ...zones];

  if (allItems.length === 0) {
    return (
      <motion.div
        initial={isMobile ? { y: '100%' } : { x: '-100%' }}
        animate={isMobile ? { y: 0 } : { x: 0 }}
        className={`fixed ${isMobile ? 'bottom-0 left-0 right-0 h-1/3 rounded-t-3xl' : 'top-20 left-4 bottom-24 w-96 rounded-2xl'}
          z-[1000] bg-zinc-900/98 backdrop-blur-2xl border border-zinc-800/50 shadow-2xl flex items-center justify-center`}
      >
        <p className="text-zinc-500">Keine Orte gefunden</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={isMobile ? { y: '100%' } : { x: '-100%' }}
      animate={isMobile ? { y: 0 } : { x: 0 }}
      className={`fixed ${isMobile ? 'bottom-0 left-0 right-0 h-2/3 rounded-t-3xl' : 'top-20 left-4 bottom-24 w-96 rounded-2xl'}
        z-[1000] bg-zinc-900/98 backdrop-blur-2xl border border-zinc-800/50 shadow-2xl flex flex-col overflow-hidden`}
    >
      <div className="flex-shrink-0 p-4 border-b border-zinc-800/50">
        <h2 className="text-lg font-bold text-white">Orte in der Nähe</h2>
        <p className="text-xs text-zinc-500 mt-1">{allItems.length} Ergebnisse</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {allItems.map((item) => {
          const isClub = item.club_type;
          const isZone = item.type && !isClub;

          return (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectLocation(item)}
              className="p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50 hover:border-green-500/50 cursor-pointer transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{isClub ? '🌿' : '🛡️'}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white flex items-center gap-2 mb-1">
                    <span className="truncate">{item.name}</span>
                    {item.verified && <CheckCircle className="w-3 h-3 text-blue-400 flex-shrink-0" />}
                  </h3>
                  {item.address && (
                    <p className="text-xs text-zinc-400 flex items-center gap-1 mb-1">
                      <MapPin className="w-3 h-3" /> {item.city}
                    </p>
                  )}
                  {item.rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs text-zinc-400">{item.rating.toFixed(1)}</span>
                    </div>
                  )}
                  {isZone && (
                    <Badge className="bg-red-500/20 text-red-400 text-xs mt-1">Schutzzone</Badge>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}