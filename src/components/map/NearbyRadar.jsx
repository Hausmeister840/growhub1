import { motion } from 'framer-motion';
import { X, Navigation, Star, MapPin } from 'lucide-react';

function isOpenNow(openingHours) {
  if (!openingHours) return null;
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayHours = openingHours[days[now.getDay()]];
  if (!todayHours || todayHours === 'Geschlossen') return false;
  const [open, close] = todayHours.split(' - ');
  if (!open || !close) return null;
  const [oH, oM] = open.split(':').map(Number);
  const [cH, cM] = close.split(':').map(Number);
  const cur = now.getHours() * 60 + now.getMinutes();
  return cur >= oH * 60 + oM && cur <= cH * 60 + cM;
}

function formatDist(d) {
  if (!d) return '';
  return d < 1000 ? `${Math.round(d)}m` : `${(d / 1000).toFixed(1)}km`;
}

export default function NearbyRadar({ locations, isOpen, onClose, onSelect, onRoute }) {
  if (!isOpen) return null;

  const sorted = [...locations].sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity)).slice(0, 10);

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 350 }}
      className="fixed bottom-0 left-0 right-0 z-[1001] bg-gradient-to-br from-white/[0.08] via-white/[0.05] to-white/[0.02] backdrop-blur-3xl border-t border-white/[0.12] rounded-t-3xl max-h-[55vh] overflow-hidden flex flex-col md:left-4 md:right-auto md:bottom-4 md:w-96 md:rounded-3xl md:border md:border-white/[0.12]"
    >
      <div className="flex justify-center py-2 md:hidden">
        <div className="w-10 h-1 rounded-full bg-white/20" />
      </div>
      <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
        <h3 className="font-bold text-white flex items-center gap-2">
          <span className="text-lg">📡</span> Nearby Radar
          <span className="text-xs text-zinc-500 font-normal">({sorted.length})</span>
        </h3>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {sorted.map(loc => {
          const open = isOpenNow(loc.opening_hours);
          return (
            <button
              key={loc.id}
              onClick={() => onSelect(loc)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] hover:border-green-500/30 transition-all text-left"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/20 flex items-center justify-center text-lg flex-shrink-0">
                {loc.club_type === 'cannabis_social_club' ? '🌿' : loc.club_type === 'dispensary' ? '🏪' : loc.club_type === 'grow_shop' ? '🌱' : loc.club_type === 'apotheke' ? '💊' : loc.club_type === 'doctor' ? '⚕️' : '🛍️'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{loc.name}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {loc.distance != null && (
                    <span className="text-xs text-blue-400 font-medium">{formatDist(loc.distance)}</span>
                  )}
                  {open !== null && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${open ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {open ? 'Offen' : 'Zu'}
                    </span>
                  )}
                  {loc.rating > 0 && (
                    <span className="text-[10px] text-yellow-400 flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-yellow-400" />{loc.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); onRoute(loc.latitude, loc.longitude); }}
                className="w-9 h-9 rounded-xl bg-green-500/20 border border-green-500/20 flex items-center justify-center text-green-400 hover:bg-green-500/30 flex-shrink-0"
              >
                <Navigation className="w-4 h-4" />
              </button>
            </button>
          );
        })}
        {sorted.length === 0 && (
          <div className="text-center py-8 text-zinc-500 text-sm">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Keine Locations in der Nähe gefunden.<br />Aktiviere deinen Standort.
          </div>
        )}
      </div>
    </motion.div>
  );
}