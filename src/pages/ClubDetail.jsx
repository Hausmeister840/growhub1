import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { 
  MapPin, Clock, Globe, Star, Heart, Share2, Navigation,
  ChevronLeft, Loader2, CheckCircle, Shield,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

const CLUB_TYPE_LABELS = {
  cannabis_social_club: { label: 'Cannabis Social Club', emoji: '🏠' },
  dispensary: { label: 'Dispensary', emoji: '💊' },
  head_shop: { label: 'Head Shop', emoji: '🛒' },
  grow_shop: { label: 'Grow Shop', emoji: '🌱' },
  doctor: { label: 'Arzt', emoji: '👨‍⚕️' },
  apotheke: { label: 'Apotheke', emoji: '💊' }
};

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function ClubDetail() {
  const [club, setClub] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const clubId = params.get('id');

  useEffect(() => {
    loadData();
  }, [clubId]);

  const loadData = async () => {
    if (!clubId) {
      navigate(createPageUrl('Map'));
      return;
    }

    setIsLoading(true);
    try {
      const [clubsData, user] = await Promise.all([
        base44.entities.Club.filter({ id: clubId }),
        base44.auth.me().catch(() => null)
      ]);
      
      const foundClub = clubsData?.[0];
      setClub(foundClub);
      setCurrentUser(user);
      
      if (user && foundClub) {
        setIsFavorite(foundClub.favorited_by_users?.includes(user.email));
      }
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Club nicht gefunden');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (!currentUser) {
      toast.error('Bitte melde dich an');
      return;
    }

    const favorites = club.favorited_by_users || [];
    const newFavorites = isFavorite
      ? favorites.filter(e => e !== currentUser.email)
      : [...favorites, currentUser.email];

    setIsFavorite(!isFavorite);

    try {
      await base44.entities.Club.update(club.id, { favorited_by_users: newFavorites });
      toast.success(isFavorite ? 'Entfernt' : 'Zu Favoriten hinzugefügt');
    } catch {
      setIsFavorite(isFavorite);
      toast.error('Fehler');
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: club?.name, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link kopiert!');
    }
  };

  const handleNavigate = () => {
    if (club?.latitude && club?.longitude) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${club.latitude},${club.longitude}`, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center">
          <MapPin className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Nicht gefunden</h2>
          <Button onClick={() => navigate(createPageUrl('Map'))}>
            Zur Karte
          </Button>
        </div>
      </div>
    );
  }

  const typeInfo = CLUB_TYPE_LABELS[club.club_type] || { label: club.club_type, emoji: '📍' };

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header Image */}
      <div className="relative h-64 bg-gradient-to-br from-green-500/30 to-black">
        {club.image_url && (
          <img src={club.image_url} alt="" className="w-full h-full object-cover" />
        )}
        
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button variant="ghost" size="icon" className="bg-black/50 backdrop-blur-sm" onClick={handleShare}>
            <Share2 className="w-5 h-5 text-white" />
          </Button>
          <Button variant="ghost" size="icon" className="bg-black/50 backdrop-blur-sm" onClick={handleFavorite}>
            <Heart className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-white'}`} />
          </Button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-green-500/20 text-green-400">
              {typeInfo.emoji} {typeInfo.label}
            </Badge>
            {club.verified && (
              <Badge className="bg-blue-500/20 text-blue-400">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verifiziert
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white">{club.name}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <Button onClick={handleNavigate} className="bg-green-600 hover:bg-green-700 flex-col h-auto py-4">
            <Navigation className="w-6 h-6 mb-1" />
            <span className="text-xs">Route</span>
          </Button>
          {club.website && (
            <Button 
              onClick={() => window.open(club.website, '_blank')}
              variant="outline"
              className="border-zinc-700 flex-col h-auto py-4"
            >
              <Globe className="w-6 h-6 mb-1" />
              <span className="text-xs">Website</span>
            </Button>
          )}
          <Button variant="outline" className="border-zinc-700 flex-col h-auto py-4">
            <MessageCircle className="w-6 h-6 mb-1" />
            <span className="text-xs">Kontakt</span>
          </Button>
        </div>

        {/* Rating */}
        {club.rating > 0 && (
          <div className="p-4 bg-zinc-900 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              <span className="text-2xl font-bold text-white">{club.rating.toFixed(1)}</span>
              <span className="text-zinc-400">/ 5</span>
            </div>
            <Button variant="outline" size="sm" className="border-zinc-700">
              Bewerten
            </Button>
          </div>
        )}

        {/* Address */}
        <div className="p-4 bg-zinc-900 rounded-xl">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-white">{club.address}</p>
              <p className="text-zinc-400">{club.city}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        {club.description && (
          <div className="p-4 bg-zinc-900 rounded-xl">
            <h3 className="font-bold text-white mb-2">Über uns</h3>
            <p className="text-zinc-400">{club.description}</p>
          </div>
        )}

        {/* Opening Hours */}
        {club.opening_hours && Object.keys(club.opening_hours).length > 0 && (
          <div className="p-4 bg-zinc-900 rounded-xl">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-500" />
              Öffnungszeiten
            </h3>
            <div className="space-y-2">
              {DAY_KEYS.map((day, idx) => (
                <div key={day} className="flex justify-between">
                  <span className="text-zinc-400">{DAYS[idx]}</span>
                  <span className="text-white">{club.opening_hours[day] || 'Geschlossen'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        {club.features?.length > 0 && (
          <div className="p-4 bg-zinc-900 rounded-xl">
            <h3 className="font-bold text-white mb-3">Ausstattung</h3>
            <div className="flex flex-wrap gap-2">
              {club.features.map((feature, i) => (
                <Badge key={i} className="bg-zinc-800 text-zinc-300">{feature}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Access Requirements */}
        {club.access_requirements && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <h3 className="font-bold text-yellow-400 mb-1">Zugangsvoraussetzungen</h3>
                <p className="text-zinc-300">{club.access_requirements}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}