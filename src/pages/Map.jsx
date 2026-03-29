import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Navigation, X, Loader2, Search, MapPin, 
  Filter, Crosshair, List, Heart, Star,
  Clock, AlertTriangle, CheckCircle, Brain,
  ArrowLeft, Radar, Flame, Plus, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import NearbyRadar from '../components/map/NearbyRadar';
import QuickAccessBar from '../components/map/QuickAccessBar';
import AddCommunitySpot from '../components/map/AddCommunitySpot';
import SpotRatingModal from '../components/map/SpotRatingModal';
import HeatmapLayer from '../components/map/HeatmapLayer';
import { useVisitedTracker } from '../components/map/VisitedTracker';
import CommunitySpotCard from '../components/map/CommunitySpotCard';

// Fix Leaflet default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const createCustomIcon = (emoji, color, pulse = false) => {
  return L.divIcon({
    html: `
      <div style="
        background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%);
        border-radius: 50%;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid rgba(255,255,255,0.9);
        box-shadow: 0 4px 16px rgba(0,0,0,0.6);
        font-size: 18px;
        ${pulse ? 'animation: pulse 2s infinite;' : ''}
      ">
        ${emoji}
      </div>
      ${pulse ? '<style>@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }</style>' : ''}
    `,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
};

// Map Controller
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

// Layer Categories
const LAYER_CATEGORIES = [
  {
    id: 'cannabis',
    name: 'Cannabis Locations',
    icon: '🌿',
    color: 'green',
    types: [
      { key: 'cannabis_social_club', label: 'Social Clubs', icon: '🌿', color: '#10b981' },
      { key: 'dispensary', label: 'Dispensaries', icon: '🏪', color: '#06b6d4' },
      { key: 'grow_shop', label: 'Grow Shops', icon: '🌱', color: '#22c55e' },
      { key: 'head_shop', label: 'Head Shops', icon: '🛍️', color: '#8b5cf6' },
      { key: 'doctor', label: 'Ärzte', icon: '⚕️', color: '#3b82f6' },
      { key: 'apotheke', label: 'Apotheken', icon: '💊', color: '#ef4444' }
    ]
  },
  {
    id: 'zones',
    name: 'Schutzzonen',
    icon: '🛡️',
    color: 'red',
    types: [
      { key: 'school', label: 'Schulen', icon: '🏫', color: '#ef4444' },
      { key: 'kindergarten', label: 'Kitas', icon: '🧸', color: '#ec4899' },
      { key: 'playground', label: 'Spielplätze', icon: '🛝', color: '#f59e0b' },
      { key: 'youth_centre', label: 'Jugendzentren', icon: '🏀', color: '#8b5cf6' },
      { key: 'sports', label: 'Sportstätten', icon: '⚽', color: '#10b981' }
    ]
  }
];

// Helper: Calculate distance
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Helper: Check if open
function isOpenNow(openingHours) {
  if (!openingHours) return null;
  
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[now.getDay()];
  const todayHours = openingHours[today];
  
  if (!todayHours || todayHours === 'Geschlossen') return false;
  
  const [open, close] = todayHours.split(' - ');
  if (!open || !close) return null;
  
  const [openH, openM] = open.split(':').map(Number);
  const [closeH, closeM] = close.split(':').map(Number);
  const currentH = now.getHours();
  const currentM = now.getMinutes();
  
  const currentMins = currentH * 60 + currentM;
  const openMins = openH * 60 + openM;
  const closeMins = closeH * 60 + closeM;
  
  return currentMins >= openMins && currentMins <= closeMins;
}

// Location Card
function LocationCard({ location, onClose, onRoute, onOpenMaps, onFavorite, isFavorite, isVisited, onMarkVisited, distance, type, userLocation }) {
  const isZone = type === 'zone';
  const openStatus = !isZone ? isOpenNow(location.opening_hours) : null;
  const walkTime = distance ? Math.ceil(distance / 80) : null;
  
  return (
    <motion.div
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 350 }}
      className="fixed bottom-0 left-0 right-0 z-[1001] 
        bg-gradient-to-br from-white/[0.08] via-white/[0.05] to-white/[0.02]
        backdrop-blur-3xl
        border-t border-white/[0.12]
        rounded-t-3xl
        shadow-[0_-8px_60px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)]
        max-h-[70vh] overflow-y-auto
        md:left-4 md:right-auto md:bottom-4 md:w-96 md:rounded-3xl md:border md:border-white/[0.12]"
    >
      {/* Drag handle */}
      <div className="flex justify-center py-2 md:hidden">
        <div className="w-10 h-1 rounded-full bg-white/20" />
      </div>
      <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
        <h3 className="font-bold text-white text-lg">{location.name}</h3>
        <div className="flex items-center gap-2">
          {!isZone && (
            <button 
              onClick={() => onFavorite(location.id)}
              className={`w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center transition-all ${isFavorite ? 'text-red-500' : 'text-zinc-400'}`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-5 py-4 space-y-3">
        {!isZone ? (
          <>
            {/* Status & Distance */}
            <div className="flex items-center gap-2 flex-wrap">
              {openStatus !== null && (
                <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                  openStatus ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  <Clock className="w-3 h-3" />
                  {openStatus ? 'Geöffnet' : 'Geschlossen'}
                </div>
              )}
              {distance && (
                <div className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400">
                  {distance < 1000 ? `${Math.round(distance)}m` : `${(distance / 1000).toFixed(1)}km`}
                </div>
              )}
              {walkTime && (
                <div className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-400">
                  ~{walkTime} Min zu Fuß
                </div>
              )}
            </div>

            {/* Rating */}
            {location.rating > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(location.rating) 
                          ? 'text-yellow-400 fill-yellow-400' 
                          : 'text-zinc-700'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-zinc-400">{location.rating.toFixed(1)}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <MapPin className="w-4 h-4 text-green-400" />
              <span>{location.address}, {location.city}</span>
            </div>

            {location.description && (
              <p className="text-sm text-zinc-300">{location.description}</p>
            )}

            {location.website && (
              <a 
                href={location.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-green-400 hover:text-green-300 flex items-center gap-2"
              >
                Website besuchen →
              </a>
            )}

            {location.opening_hours && (
              <div className="text-xs text-zinc-400 space-y-1">
                <p className="font-semibold text-white mb-1">Öffnungszeiten:</p>
                {Object.entries(location.opening_hours).map(([day, hours]) => {
                  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                  const isToday = days[new Date().getDay()] === day;
                  return (
                    <div key={day} className={`flex justify-between ${isToday ? 'text-green-400 font-bold' : ''}`}>
                      <span className="capitalize">{day}:</span>
                      <span>{hours}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {location.features && location.features.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-white mb-1">Features:</p>
                <div className="flex flex-wrap gap-1">
                  {location.features.map(f => (
                    <span key={f} className="px-2 py-0.5 bg-zinc-800 rounded text-xs text-zinc-400">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                In dieser Schutzzone ist der Konsum verboten
              </p>
            </div>
            {distance && (
              <div className="text-sm text-zinc-400">
                <p>Entfernung: {distance < 1000 ? `${Math.round(distance)}m` : `${(distance / 1000).toFixed(1)}km`}</p>
              </div>
            )}
            <div className="text-sm text-zinc-400">
              <p>Radius: {location.radius_meters || 100}m</p>
              <p className="capitalize">Typ: {location.type?.replace('_', ' ')}</p>
            </div>
          </>
        )}

        <div className="flex gap-2">
          <button 
            onClick={() => onRoute(location.latitude, location.longitude)}
            className="flex-1 py-3 bg-gradient-to-r from-green-500/80 to-emerald-600/80 hover:from-green-500 hover:to-emerald-600 text-white font-bold rounded-2xl border border-green-400/20 shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Navigation className="w-4 h-4" />
            Zu Fuß
          </button>
          <button 
            onClick={() => onOpenMaps?.(location.latitude, location.longitude)}
            className="flex-1 py-3 bg-blue-500/20 text-blue-400 font-bold rounded-2xl border border-blue-500/20 hover:border-blue-500/40 transition-all flex items-center justify-center gap-2 text-sm"
          >
            🚗 Google Maps
          </button>
        </div>

        {!isZone && (
          <div className="flex gap-2">
            {!isVisited && onMarkVisited && (
              <button
                onClick={onMarkVisited}
                className="flex-1 py-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-zinc-300 font-medium text-xs flex items-center justify-center gap-1.5 hover:border-green-500/30 transition-all"
              >
                <Eye className="w-3.5 h-3.5" /> Als besucht markieren
              </button>
            )}
            {isVisited && (
              <div className="flex-1 py-2.5 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 font-medium text-xs flex items-center justify-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> Besucht ✓
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Location List
function LocationList({ locations, onSelect, onClose }) {
  return (
    <motion.div
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 350 }}
      className="fixed bottom-0 left-0 right-0 z-[1001] 
        bg-gradient-to-br from-white/[0.08] via-white/[0.05] to-white/[0.02]
        backdrop-blur-3xl border-t border-white/[0.12] rounded-t-3xl
        shadow-[0_-8px_60px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)]
        max-h-[60vh] overflow-hidden flex flex-col
        md:left-4 md:right-auto md:bottom-4 md:w-96 md:rounded-3xl md:border md:border-white/[0.12] md:max-h-[calc(100vh-10rem)]"
    >
      <div className="flex justify-center py-2 md:hidden">
        <div className="w-10 h-1 rounded-full bg-white/20" />
      </div>
      <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
        <h3 className="font-bold text-white flex items-center gap-2">
          <List className="w-5 h-5 text-green-400" />
          Locations ({locations.length})
        </h3>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-all">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {locations.map((loc) => {
          const openStatus = loc.opening_hours ? isOpenNow(loc.opening_hours) : null;
          
          return (
            <motion.button
              key={loc.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(loc)}
              className="w-full p-3 mb-2 bg-white/[0.04] rounded-xl border border-white/[0.08] hover:border-green-500/30 hover:bg-white/[0.06] transition-all text-left"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{loc.isZone ? '🛡️' : '🌿'}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white text-sm mb-1">{loc.name}</h4>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {!loc.isZone && openStatus !== null && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        openStatus ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {openStatus ? 'Offen' : 'Geschlossen'}
                      </span>
                    )}
                    {loc.distance && (
                      <span className="text-xs text-zinc-400">
                        {loc.distance < 1000 ? `${Math.round(loc.distance)}m` : `${(loc.distance / 1000).toFixed(1)}km`}
                      </span>
                    )}
                    {loc.rating > 0 && (
                      <span className="text-xs text-zinc-400 flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        {loc.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  {loc.address && (
                    <p className="text-xs text-zinc-500">{loc.city}</p>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

// Filter Panel
function FilterPanel({ isOpen, onClose, filters, onFilterChange }) {
  if (!isOpen) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 z-[1001]"
      />
      <div className="fixed inset-0 backdrop-blur-2xl z-[1001] pointer-events-none" />
      
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed left-0 top-0 bottom-0 w-80 bg-gradient-to-br from-white/[0.08] via-white/[0.05] to-white/[0.02] backdrop-blur-3xl border-r border-white/[0.12] shadow-[inset_-1px_0_0_rgba(255,255,255,0.1)] z-[1002] overflow-y-auto"
      >
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="font-bold text-white flex items-center gap-2">
            <Filter className="w-5 h-5 text-green-400" />
            Filter & Layer
          </h2>
          <button onClick={onClose} aria-label="Schließen" className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

      <div className="p-4 space-y-6">
        {/* Distanz Filter */}
        <div>
          <label className="text-sm font-semibold text-white mb-2 block">Max. Distanz</label>
          <select
            value={filters.maxDistance}
            onChange={(e) => onFilterChange('maxDistance', Number(e.target.value))}
            className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
          >
            <option value={0}>Alle</option>
            <option value={500}>500m</option>
            <option value={1000}>1km</option>
            <option value={2000}>2km</option>
            <option value={5000}>5km</option>
          </select>
        </div>

        {/* Rating Filter */}
        <div>
          <label className="text-sm font-semibold text-white mb-2 block">Min. Bewertung</label>
          <select
            value={filters.minRating}
            onChange={(e) => onFilterChange('minRating', Number(e.target.value))}
            className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
          >
            <option value={0}>Alle</option>
            <option value={3}>3+ Sterne</option>
            <option value={4}>4+ Sterne</option>
            <option value={4.5}>4.5+ Sterne</option>
          </select>
        </div>

        {/* Open Now Filter */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white">Nur geöffnete</span>
          <button
            onClick={() => onFilterChange('openNow', !filters.openNow)}
            className={`w-12 h-6 rounded-full transition-colors ${
              filters.openNow ? 'bg-green-500' : 'bg-zinc-700'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
              filters.openNow ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        {/* Layer Categories */}
        {LAYER_CATEGORIES.map(category => (
          <div key={category.id}>
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span className="text-xl">{category.icon}</span>
              {category.name}
            </h3>
            <div className="space-y-2">
              {category.types.map(type => (
                <button
                  key={type.key}
                  onClick={() => onFilterChange('layer', type.key)}
                  className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
                    filters.layers[type.key]
                      ? 'bg-green-500/20 border-2 border-green-500/40'
                      : 'bg-white/[0.04] border-2 border-white/[0.08] hover:border-white/[0.15]'
                  }`}
                >
                  <span className="text-xl">{type.icon}</span>
                  <span className={`text-sm font-medium ${filters.layers[type.key] ? 'text-white' : 'text-zinc-400'}`}>
                    {type.label}
                  </span>
                  {filters.layers[type.key] && (
                    <CheckCircle className="w-4 h-4 text-green-400 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-white/[0.06] space-y-2">
        <button 
          onClick={() => onFilterChange('clearLayers')}
          className="w-full py-3 rounded-xl border border-white/[0.1] text-zinc-300 hover:bg-white/[0.06] transition-all text-sm font-medium"
        >
          Layer zurücksetzen
        </button>
        <button 
          onClick={() => onFilterChange('clearAll')}
          className="w-full py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium"
        >
          Alle Filter zurücksetzen
        </button>
      </div>
      </motion.div>
    </>
  );
}

// Zone Status Banner
function ZoneStatusBanner({ status, onClose, onNavigate }) {
  if (!status.checked) return null;

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      exit={{ y: -100 }}
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[1003] max-w-md w-[calc(100%-2rem)] p-4 rounded-2xl backdrop-blur-xl ${
        status.inZone ? 'bg-red-600/95' : 'bg-green-600/95'
      }`}
    >
      <div className="flex items-start gap-3">
        {status.inZone ? (
          <AlertTriangle className="w-6 h-6 text-white flex-shrink-0" />
        ) : (
          <CheckCircle className="w-6 h-6 text-white flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm mb-1">
            {status.inZone ? '⚠️ SCHUTZZONE!' : '✓ Standort sicher'}
          </p>
          <p className="text-xs text-white/90">
            {status.inZone 
              ? `Du bist ${Math.round(status.distance)}m von ${status.zoneName} entfernt`
              : 'Keine Schutzzonen in der Nähe'
            }
          </p>
          {status.safeSpots.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-xs font-bold text-white">Sichere Spots in der Nähe:</p>
              {status.safeSpots.slice(0, 2).map((spot, i) => (
                <button
                  key={i}
                  onClick={() => onNavigate(spot)}
                  className="block text-xs text-white/80 hover:text-white underline"
                >
                  → {spot.name} ({Math.round(spot.distance)}m)
                </button>
              ))}
            </div>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 flex-shrink-0">
          <X className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

export default function Map() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [zones, setZones] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [mapCenter, setMapCenter] = useState([52.520008, 13.404954]);
  const [mapZoom, setMapZoom] = useState(13);
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showList, setShowList] = useState(false);
  const [filters, setFilters] = useState({
    layers: {},
    maxDistance: 0,
    minRating: 0,
    openNow: false
  });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [zoneStatus, setZoneStatus] = useState({
    checked: false,
    inZone: false,
    distance: 0,
    zoneName: '',
    safeSpots: []
  });
  const [showNearbyRadar, setShowNearbyRadar] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showAddSpot, setShowAddSpot] = useState(false);
  const [communitySpots, setCommunitySpots] = useState([]);
  const [ratingSpot, setRatingSpot] = useState(null);
  const [routePath, setRoutePath] = useState(null);
  const watchIdRef = useRef(null);

  // Load user & data
  useEffect(() => {
    const init = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        setFavorites(user.favorited_locations || []);
      } catch {
        setCurrentUser(null);
      }

      try {
        const [fetchedClubs, fetchedZones, fetchedSpots] = await Promise.all([
          base44.entities.Club.list('-created_date', 500).catch(() => []),
          base44.entities.NoGoZone.list('-created_date', 500).catch(() => []),
          base44.entities.CommunitySpot.filter({ status: 'approved' }, '-created_date', 200).catch(() => []),
        ]);
        setClubs(fetchedClubs || []);
        setZones(fetchedZones || []);
        setCommunitySpots(fetchedSpots || []);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    init();
  }, []);

  // Check zone status
  const checkZoneStatus = useCallback(async (lat, lng) => {
    const nearbyZones = zones.filter(z => {
      const dist = calculateDistance(lat, lng, z.latitude, z.longitude);
      return dist <= (z.radius_meters || 100) + 100; // +100m buffer
    });

    if (nearbyZones.length === 0) {
      setZoneStatus({ checked: true, inZone: false, distance: 0, zoneName: '', safeSpots: [] });
      return;
    }

    const closestZone = nearbyZones[0];
    const distance = calculateDistance(lat, lng, closestZone.latitude, closestZone.longitude);

    // Find safe spots (clubs not in zones)
    const safeSpots = clubs
      .filter(c => {
        const inZone = zones.some(z => {
          const d = calculateDistance(c.latitude, c.longitude, z.latitude, z.longitude);
          return d <= (z.radius_meters || 100);
        });
        return !inZone;
      })
      .map(c => ({
        ...c,
        distance: calculateDistance(lat, lng, c.latitude, c.longitude)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);

    setZoneStatus({
      checked: true,
      inZone: true,
      distance,
      zoneName: closestZone.name,
      safeSpots
    });
  }, [zones, clubs]);

  // Locate user
  const locateUser = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation nicht verfügbar');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const location = { lat: latitude, lng: longitude, accuracy };
        
        setUserLocation(location);
        setMapCenter([latitude, longitude]);
        setMapZoom(16);
        setIsLocating(false);
        
        toast.success('Standort gefunden!');
        checkZoneStatus(latitude, longitude);

        // Watch position
        if (watchIdRef.current) {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const newLoc = { 
              lat: pos.coords.latitude, 
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy
            };
            setUserLocation(newLoc);
            checkZoneStatus(pos.coords.latitude, pos.coords.longitude);
          },
          null,
          { enableHighAccuracy: true, maximumAge: 10000 }
        );
      },
      (error) => {
        setIsLocating(false);
        toast.error('Standort konnte nicht ermittelt werden');
        console.error('Geolocation error:', error);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, [checkZoneStatus]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setMapCenter([parseFloat(lat), parseFloat(lon)]);
        setMapZoom(15);
        toast.success('Ort gefunden!');
      } else {
        toast.error('Ort nicht gefunden');
      }
    } catch (error) {
      toast.error('Suche fehlgeschlagen');
    }
  }, [searchQuery]);

  // Filter change
  const handleFilterChange = useCallback((type, value) => {
    if (type === 'clearAll') {
      setFilters({ layers: {}, maxDistance: 0, minRating: 0, openNow: false });
      return;
    }
    if (type === 'clearLayers') {
      setFilters(prev => ({ ...prev, layers: {} }));
      return;
    }
    if (type === 'layer') {
      setFilters(prev => {
        const newLayers = { ...prev.layers };
        if (newLayers[value]) {
          delete newLayers[value];
        } else {
          newLayers[value] = true;
        }
        return { ...prev, layers: newLayers };
      });
      return;
    }
    setFilters(prev => ({ ...prev, [type]: value }));
  }, []);

  // Toggle favorite
  const handleFavorite = useCallback(async (locationId) => {
    if (!currentUser) {
      toast.error('Bitte melde dich an');
      return;
    }

    const isFav = favorites.includes(locationId);
    const newFavorites = isFav 
      ? favorites.filter(id => id !== locationId)
      : [...favorites, locationId];

    setFavorites(newFavorites);

    try {
      await base44.auth.updateMe({ favorited_locations: newFavorites });
      toast.success(isFav ? 'Aus Favoriten entfernt' : 'Zu Favoriten hinzugefügt');
    } catch (error) {
      setFavorites(favorites); // Revert
      toast.error('Fehler beim Speichern');
    }
  }, [currentUser, favorites]);

  // Visited tracker
  const { visited, markVisited, isVisited } = useVisitedTracker(currentUser);

  // Route to location — fetch real walking route via OSRM
  const handleRouteTo = useCallback(async (lat, lng) => {
    if (!userLocation) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
      return;
    }
    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/foot/${userLocation.lng},${userLocation.lat};${lng},${lat}?overview=full&geometries=geojson`
      );
      const data = await res.json();
      if (data.routes?.[0]?.geometry?.coordinates) {
        const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
        setRoutePath(coords);
        const mins = Math.round(data.routes[0].duration / 60);
        const km = (data.routes[0].distance / 1000).toFixed(1);
        toast.success(`Route: ${km}km · ~${mins} Min zu Fuß`);
      } else {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`, '_blank');
      }
    } catch {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`, '_blank');
    }
  }, [userLocation]);

  // Open in Google Maps (driving)
  const handleOpenGoogleMaps = useCallback((lat, lng) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, '_blank');
  }, []);

  // Filter & sort locations
  const processedLocations = useMemo(() => {
    let filtered = clubs
      .filter(c => filters.layers[c.club_type])
      .map(c => ({
        ...c,
        isZone: false,
        distance: userLocation ? calculateDistance(userLocation.lat, userLocation.lng, c.latitude, c.longitude) : null
      }));

    // Apply filters
    if (filters.maxDistance > 0 && userLocation) {
      filtered = filtered.filter(l => l.distance && l.distance <= filters.maxDistance);
    }
    if (filters.minRating > 0) {
      filtered = filtered.filter(l => l.rating >= filters.minRating);
    }
    if (filters.openNow) {
      filtered = filtered.filter(l => isOpenNow(l.opening_hours) === true);
    }

    // Sort by distance
    if (userLocation) {
      filtered.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }

    return filtered;
  }, [clubs, filters, userLocation]);

  const processedZones = useMemo(() => {
    return zones
      .filter(z => filters.layers[z.type])
      .map(z => ({
        ...z,
        isZone: true,
        distance: userLocation ? calculateDistance(userLocation.lat, userLocation.lng, z.latitude, z.longitude) : null
      }));
  }, [zones, filters, userLocation]);

  const hasActiveLayers = Object.keys(filters.layers).length > 0;

  // All locations for nearby radar and heatmap (clubs with distance)
  const allLocationsWithDist = useMemo(() => {
    if (!userLocation) return clubs;
    return clubs.map(c => ({
      ...c,
      distance: calculateDistance(userLocation.lat, userLocation.lng, c.latitude, c.longitude),
    }));
  }, [clubs, userLocation]);

  // Heatmap data — combine clubs + community spots
  const heatmapPoints = useMemo(() => {
    return [
      ...clubs.map(c => ({ latitude: c.latitude, longitude: c.longitude })),
      ...communitySpots.map(s => ({ latitude: s.latitude, longitude: s.longitude })),
    ];
  }, [clubs, communitySpots]);

  // SPOT_TYPE icons
  const SPOT_ICONS = {
    smoke_spot: { emoji: '🌿', color: '#22c55e' },
    meetup: { emoji: '🤝', color: '#3b82f6' },
    scenic: { emoji: '🏞️', color: '#06b6d4' },
    chill_zone: { emoji: '😌', color: '#a855f7' },
    grow_shop_tip: { emoji: '🌱', color: '#10b981' },
    other: { emoji: '📍', color: '#f59e0b' },
  };

  return (
    <div className="relative w-full h-screen bg-black">
      {/* Back Button + Search Bar */}
      <div className="fixed top-12 left-0 right-0 z-[1001] px-3">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          <button
            onClick={() => window.history.back()}
            className="h-11 w-11 rounded-full bg-black/60 backdrop-blur-xl border border-white/[0.15] shadow-lg flex items-center justify-center text-zinc-200 hover:text-white hover:bg-black/80 transition-all flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <Input
              placeholder="Adresse suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 bg-black/60 backdrop-blur-xl border-white/[0.15] text-white placeholder:text-zinc-500 rounded-full h-11 shadow-lg focus-visible:ring-green-500/50"
            />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowFilters(prev => !prev);
            }}
            className={`h-11 w-11 rounded-full transition-all flex items-center justify-center flex-shrink-0 shadow-lg border backdrop-blur-xl ${
              hasActiveLayers 
                ? 'bg-green-500/80 border-green-400/30 text-white hover:bg-green-500' 
                : 'bg-black/60 border-white/[0.15] text-zinc-300 hover:text-white hover:bg-black/80'
            }`}
            aria-label="Filter öffnen"
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Zone Status Banner */}
      <AnimatePresence>
        {zoneStatus.checked && (
          <ZoneStatusBanner
            status={zoneStatus}
            onClose={() => setZoneStatus(prev => ({ ...prev, checked: false }))}
            onNavigate={(spot) => {
              setMapCenter([spot.latitude, spot.longitude]);
              setMapZoom(16);
              setSelectedLocation(spot);
              setSelectedType('club');
            }}
          />
        )}
      </AnimatePresence>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <FilterPanel
            isOpen={showFilters}
            onClose={() => setShowFilters(false)}
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        )}
      </AnimatePresence>

      {/* Location List */}
      <AnimatePresence>
        {showList && hasActiveLayers && (
          <LocationList
            locations={[...processedLocations, ...processedZones]}
            onSelect={(loc) => {
              setSelectedLocation(loc);
              setSelectedType(loc.isZone ? 'zone' : 'club');
              setMapCenter([loc.latitude, loc.longitude]);
              setMapZoom(16);
              setShowList(false);
            }}
            onClose={() => setShowList(false)}
          />
        )}
      </AnimatePresence>

      {/* Location Detail */}
      <AnimatePresence>
        {selectedLocation && selectedType !== 'community' && (
          <LocationCard
            location={selectedLocation}
            type={selectedType}
            distance={selectedLocation.distance}
            userLocation={userLocation}
            isFavorite={favorites.includes(selectedLocation.id)}
            onFavorite={handleFavorite}
            isVisited={isVisited(selectedLocation.id)}
            onMarkVisited={() => markVisited(selectedLocation.id, selectedLocation.name)}
            onClose={() => {
              setSelectedLocation(null);
              setSelectedType(null);
              setRoutePath(null);
            }}
            onRoute={handleRouteTo}
            onOpenMaps={handleOpenGoogleMaps}
          />
        )}
      </AnimatePresence>

      {/* Community Spot Detail */}
      <AnimatePresence>
        {selectedLocation?.isCommunitySpot && (
          <CommunitySpotCard
            spot={selectedLocation}
            currentUser={currentUser}
            onClose={() => { setSelectedLocation(null); setSelectedType(null); }}
            onRate={() => setRatingSpot(selectedLocation)}
            onRoute={() => handleRouteTo(selectedLocation.latitude, selectedLocation.longitude)}
            onUpvote={async () => {
              if (!currentUser) { toast.error('Bitte anmelden'); return; }
              const ups = selectedLocation.upvotes || [];
              const has = ups.includes(currentUser.email);
              const newUps = has ? ups.filter(e => e !== currentUser.email) : [...ups, currentUser.email];
              await base44.entities.CommunitySpot.update(selectedLocation.id, { upvotes: newUps });
              setCommunitySpots(prev => prev.map(s => s.id === selectedLocation.id ? { ...s, upvotes: newUps } : s));
              setSelectedLocation(prev => ({ ...prev, upvotes: newUps }));
              toast.success(has ? 'Upvote entfernt' : 'Upvote! 👍');
            }}
          />
        )}
      </AnimatePresence>

      {/* Nearby Radar */}
      <AnimatePresence>
        {showNearbyRadar && (
          <NearbyRadar
            locations={allLocationsWithDist}
            isOpen={showNearbyRadar}
            onClose={() => setShowNearbyRadar(false)}
            onSelect={(loc) => {
              setSelectedLocation(loc);
              setSelectedType('club');
              setMapCenter([loc.latitude, loc.longitude]);
              setMapZoom(16);
              setShowNearbyRadar(false);
              handleRouteTo(loc.latitude, loc.longitude);
            }}
            onRoute={handleRouteTo}
          />
        )}
      </AnimatePresence>

      {/* Add Community Spot */}
      <AnimatePresence>
        {showAddSpot && (
          <AddCommunitySpot
            isOpen={showAddSpot}
            onClose={() => setShowAddSpot(false)}
            mapCenter={mapCenter}
            onSpotAdded={(spot) => setCommunitySpots(prev => [...prev, spot])}
          />
        )}
      </AnimatePresence>

      {/* Rate Community Spot */}
      <AnimatePresence>
        {ratingSpot && currentUser && (
          <SpotRatingModal
            spot={ratingSpot}
            currentUser={currentUser}
            onClose={() => setRatingSpot(null)}
            onRated={(updated) => {
              setCommunitySpots(prev => prev.map(s => s.id === updated.id ? updated : s));
            }}
          />
        )}
      </AnimatePresence>

      {/* Quick Access Bar (left side) */}
      <QuickAccessBar
        clubs={clubs}
        userLocation={userLocation}
        onNavigate={(loc) => {
          setSelectedLocation({ ...loc, distance: loc.dist });
          setSelectedType('club');
          setMapCenter([loc.latitude, loc.longitude]);
          setMapZoom(16);
          handleRouteTo(loc.latitude, loc.longitude);
        }}
      />

      {/* Controls - Glass Style (right side) */}
      <div className="fixed bottom-24 lg:bottom-6 right-4 z-[1000] flex flex-col gap-2.5">
        <button
          onClick={locateUser}
          disabled={isLocating}
          className="h-12 w-12 rounded-2xl bg-gradient-to-br from-white/[0.1] to-white/[0.04] backdrop-blur-xl border border-white/[0.12] shadow-lg flex items-center justify-center text-white hover:bg-white/[0.15] transition-all disabled:opacity-50"
          title="Standort"
        >
          {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crosshair className="w-5 h-5" />}
        </button>

        {userLocation && (
          <button
            onClick={() => setShowNearbyRadar(!showNearbyRadar)}
            className={`h-12 w-12 rounded-2xl backdrop-blur-xl border shadow-lg flex items-center justify-center text-white transition-all ${
              showNearbyRadar ? 'bg-cyan-500/70 border-cyan-400/30' : 'bg-gradient-to-br from-white/[0.1] to-white/[0.04] border-white/[0.12] hover:bg-white/[0.15]'
            }`}
            title="Nearby Radar"
          >
            <Radar className="w-5 h-5" />
          </button>
        )}

        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`h-12 w-12 rounded-2xl backdrop-blur-xl border shadow-lg flex items-center justify-center text-white transition-all ${
            showHeatmap ? 'bg-orange-500/70 border-orange-400/30' : 'bg-gradient-to-br from-white/[0.1] to-white/[0.04] border-white/[0.12] hover:bg-white/[0.15]'
          }`}
          title="Heatmap"
        >
          <Flame className="w-5 h-5" />
        </button>

        <button
          onClick={() => setShowAddSpot(true)}
          className="h-12 w-12 rounded-2xl bg-green-500/70 backdrop-blur-xl border border-green-400/20 shadow-lg flex items-center justify-center text-white hover:bg-green-500/90 transition-all"
          title="Community-Spot hinzufügen"
        >
          <Plus className="w-5 h-5" />
        </button>

        {hasActiveLayers && (
          <button
            onClick={() => setShowList(!showList)}
            className="h-12 w-12 rounded-2xl bg-green-500/70 backdrop-blur-xl border border-green-400/20 shadow-lg flex items-center justify-center text-white hover:bg-green-500/90 transition-all"
            title="Liste"
          >
            <List className="w-5 h-5" />
          </button>
        )}

        {userLocation && (
          <button
            onClick={() => checkZoneStatus(userLocation.lat, userLocation.lng)}
            className="h-12 w-12 rounded-2xl bg-purple-500/70 backdrop-blur-xl border border-purple-400/20 shadow-lg flex items-center justify-center text-white hover:bg-purple-500/90 transition-all"
            title="Zonen-Check"
          >
            <Brain className="w-5 h-5" />
          </button>
        )}

        {routePath && (
          <button
            onClick={() => setRoutePath(null)}
            className="h-12 w-12 rounded-2xl bg-red-500/70 backdrop-blur-xl border border-red-400/20 shadow-lg flex items-center justify-center text-white hover:bg-red-500/90 transition-all"
            title="Route löschen"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Map */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapController center={mapCenter} zoom={mapZoom} />

        {/* User Location with Accuracy Circle */}
        {userLocation && (
          <>
            <Marker position={[userLocation.lat, userLocation.lng]} />
            {userLocation.accuracy && (
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={userLocation.accuracy}
                pathOptions={{
                  color: '#3b82f6',
                  fillColor: '#3b82f6',
                  fillOpacity: 0.15,
                  weight: 2
                }}
              />
            )}
          </>
        )}

        {/* Cannabis Locations */}
        {processedLocations.map((club) => {
          const typeConfig = LAYER_CATEGORIES[0].types.find(t => t.key === club.club_type);
          const isSafeSpot = zoneStatus.safeSpots.some(s => s.id === club.id);
          return (
            <Marker
              key={club.id}
              position={[club.latitude, club.longitude]}
              icon={createCustomIcon(typeConfig?.icon || '🌿', typeConfig?.color || '#10b981', isSafeSpot)}
              eventHandlers={{
                click: () => {
                  setSelectedLocation(club);
                  setSelectedType('club');
                  setMapCenter([club.latitude, club.longitude]);
                  setMapZoom(16);
                }
              }}
            />
          );
        })}

        {/* No-Go Zones */}
        {processedZones.map((zone) => {
          const typeConfig = LAYER_CATEGORIES[1].types.find(t => t.key === zone.type);
          return (
            <React.Fragment key={zone.id}>
              <Marker
                position={[zone.latitude, zone.longitude]}
                icon={createCustomIcon(typeConfig?.icon || '🛡️', typeConfig?.color || '#ef4444')}
                eventHandlers={{
                  click: () => {
                    setSelectedLocation(zone);
                    setSelectedType('zone');
                    setMapCenter([zone.latitude, zone.longitude]);
                    setMapZoom(16);
                  }
                }}
              />
              <Circle
                center={[zone.latitude, zone.longitude]}
                radius={zone.radius_meters || 100}
                pathOptions={{
                  color: '#ef4444',
                  fillColor: '#ef4444',
                  fillOpacity: 0.2,
                  weight: 2
                }}
              />
            </React.Fragment>
          );
        })}

        {/* Heatmap Layer */}
        <HeatmapLayer locations={heatmapPoints} enabled={showHeatmap} />

        {/* Community Spots */}
        {communitySpots.map(spot => {
          const cfg = SPOT_ICONS[spot.spot_type] || SPOT_ICONS.other;
          return (
            <Marker
              key={`spot_${spot.id}`}
              position={[spot.latitude, spot.longitude]}
              icon={createCustomIcon(cfg.emoji, cfg.color)}
              eventHandlers={{
                click: () => {
                  setSelectedLocation({
                    ...spot,
                    isCommunitySpot: true,
                    distance: userLocation ? calculateDistance(userLocation.lat, userLocation.lng, spot.latitude, spot.longitude) : null,
                  });
                  setSelectedType('community');
                  setMapCenter([spot.latitude, spot.longitude]);
                  setMapZoom(16);
                }
              }}
            />
          );
        })}

        {/* Real walking route */}
        {routePath && (
          <Polyline
            positions={routePath}
            pathOptions={{ color: '#22c55e', weight: 4, opacity: 0.85 }}
          />
        )}

        {/* Fallback straight line if no route but selected */}
        {!routePath && selectedLocation && userLocation && !selectedLocation.isZone && (
          <Polyline
            positions={[[userLocation.lat, userLocation.lng], [selectedLocation.latitude, selectedLocation.longitude]]}
            pathOptions={{ color: '#10b981', weight: 2, opacity: 0.4, dashArray: '8, 8' }}
          />
        )}

        {/* Safe Spot Routes */}
        {zoneStatus.safeSpots.map((spot, i) => userLocation && (
          <Polyline
            key={i}
            positions={[[userLocation.lat, userLocation.lng], [spot.latitude, spot.longitude]]}
            pathOptions={{ color: '#22c55e', weight: 2, opacity: 0.5, dashArray: '10, 10' }}
          />
        ))}
      </MapContainer>
    </div>
  );
}