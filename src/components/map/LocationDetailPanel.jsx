import { motion } from 'framer-motion';
import { X, MapPin, Globe, Clock, Info, CheckCircle, ExternalLink, Star, Navigation as NavigationIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ClubIcon = ({ type, size = "w-5 h-5" }) => {
  const icons = {
    cannabis_social_club: <span className="text-xl">🌿</span>,
    dispensary: <span className="text-xl">🏪</span>,
    head_shop: <span className="text-xl">🛍️</span>,
    grow_shop: <span className="text-xl">🌱</span>,
    doctor: <span className="text-xl">⚕️</span>,
    apotheke: <span className="text-xl">💊</span>
  };
  return icons[type] || <span className="text-xl">🏢</span>;
};

export default function LocationDetailPanel({ location, onClose, onRouteTo, isMobile }) {
  if (!location) return null;

  const isClub = location.club_type;
  const isNoGoZone = location.type && !isClub;

  return (
    <motion.div
      initial={isMobile ? { y: '100%' } : { x: '-100%' }}
      animate={isMobile ? { y: 0 } : { x: 0 }}
      exit={isMobile ? { y: '100%' } : { x: '-100%' }}
      className={`fixed ${isMobile ? 'bottom-0 left-0 right-0 h-2/3 rounded-t-3xl' : 'top-20 left-4 bottom-24 w-96 rounded-2xl'}
        z-[1000] bg-zinc-900/98 backdrop-blur-2xl border border-zinc-800/50 shadow-2xl flex flex-col overflow-hidden`}
    >
      <div className="flex-shrink-0 p-4 border-b border-zinc-800/50 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          {isClub && <ClubIcon type={location.club_type} />}
          Details
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-zinc-400 hover:text-white">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isClub ? (
          <>
            <div>
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                {location.name}
                {location.verified && <CheckCircle className="w-5 h-5 text-blue-400" />}
              </h3>
              {location.rating > 0 && (
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm text-zinc-300">{location.rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {location.description && <p className="text-sm text-zinc-400">{location.description}</p>}

            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2 text-zinc-300">
                <MapPin className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" />
                <span>{location.address}, {location.city}</span>
              </div>

              {location.website && (
                <a href={location.website} target="_blank" rel="noopener noreferrer" 
                   className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors">
                  <Globe className="w-4 h-4" />
                  <span className="truncate">Website besuchen</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              {location.specialization && (
                <div className="flex items-start gap-2 text-zinc-300">
                  <Info className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" />
                  <span>{location.specialization}</span>
                </div>
              )}
            </div>

            {location.opening_hours && (
              <div>
                <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-400" /> Öffnungszeiten
                </h4>
                <div className="space-y-1 text-xs text-zinc-400">
                  {Object.entries(location.opening_hours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between">
                      <span className="capitalize">{day}:</span>
                      <span>{hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {location.features && location.features.length > 0 && (
              <div>
                <h4 className="font-semibold text-white mb-2">Ausstattung</h4>
                <div className="flex flex-wrap gap-2">
                  {location.features.map(feature => (
                    <Badge key={feature} variant="secondary" className="text-xs">{feature}</Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : isNoGoZone ? (
          <>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">{location.name}</h3>
              <Badge className="bg-red-500/20 text-red-400 border-red-500/50">Schutzzone</Badge>
            </div>
            <p className="text-sm text-red-400">In dieser Zone ist der Konsum von Cannabis untersagt.</p>
            <div className="space-y-2 text-sm text-zinc-400">
              <div>Typ: <span className="text-zinc-300">{location.type}</span></div>
              <div>Radius: <span className="text-zinc-300">{location.radius_meters || 100}m</span></div>
            </div>
          </>
        ) : null}
      </div>

      <div className="flex-shrink-0 p-4 border-t border-zinc-800/50 space-y-2">
        {onRouteTo && (
          <Button 
            onClick={() => onRouteTo(location.latitude, location.longitude)} 
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <NavigationIcon className="w-4 h-4 mr-2" />
            Route berechnen
          </Button>
        )}
      </div>
    </motion.div>
  );
}