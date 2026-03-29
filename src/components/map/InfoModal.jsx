import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Globe, Clock, Info, CheckCircle, ExternalLink, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function InfoModal({ location, isOpen, onClose }) {
  if (!isOpen || !location) return null;

  const isClub = location.club_type;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1001] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-zinc-900 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto border border-zinc-800"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-xl font-bold text-white">{location.name}</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="p-6 space-y-6">
            {isClub && (
              <>
                {location.image_url && (
                  <img src={location.image_url} alt={location.name} className="w-full h-48 object-cover rounded-xl" />
                )}
                
                <div className="flex items-center gap-3">
                  {location.verified && (
                    <Badge className="bg-blue-500/20 text-blue-400">
                      <CheckCircle className="w-3 h-3 mr-1" /> Verifiziert
                    </Badge>
                  )}
                  {location.rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm text-zinc-300">{location.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {location.description && (
                  <p className="text-zinc-400">{location.description}</p>
                )}

                <div className="grid gap-4">
                  <div className="flex items-center gap-3 text-zinc-300">
                    <MapPin className="w-5 h-5 text-green-400" />
                    <span>{location.address}, {location.city}</span>
                  </div>

                  {location.website && (
                    <a href={location.website} target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-3 text-green-400 hover:text-green-300">
                      <Globe className="w-5 h-5" />
                      <span>Website besuchen</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                {location.opening_hours && (
                  <div>
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-green-400" /> Öffnungszeiten
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(location.opening_hours).map(([day, hours]) => (
                        <div key={day} className="flex justify-between text-sm">
                          <span className="text-zinc-400 capitalize">{day}:</span>
                          <span className="text-zinc-300">{hours}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {location.features && location.features.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-white mb-3">Ausstattung & Services</h4>
                    <div className="flex flex-wrap gap-2">
                      {location.features.map(feature => (
                        <Badge key={feature} variant="secondary">{feature}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {location.specialization && (
                  <div>
                    <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                      <Info className="w-5 h-5 text-green-400" /> Spezialisierung
                    </h4>
                    <p className="text-zinc-400">{location.specialization}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}