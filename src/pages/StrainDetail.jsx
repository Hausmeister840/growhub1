import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { 
  Leaf, Star, ChevronLeft, Heart, Share2,
  Zap, Droplets, Clock, Award, Loader2, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function StrainDetail() {
  const [strain, setStrain] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const strainId = params.get('id');

  useEffect(() => {
    loadData();
  }, [strainId]);

  const loadData = async () => {
    if (!strainId) {
      navigate(createPageUrl('Strains'));
      return;
    }

    setIsLoading(true);
    try {
      const [strainsData, user] = await Promise.all([
        base44.entities.Strain.filter({ id: strainId }),
        base44.auth.me().catch(() => null)
      ]);
      
      setStrain(strainsData?.[0] || null);
      setCurrentUser(user);
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Strain nicht gefunden');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: strain?.name, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link kopiert!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
      </div>
    );
  }

  if (!strain) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center">
          <Leaf className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Strain nicht gefunden</h2>
          <Button onClick={() => navigate(createPageUrl('Strains'))}>
            Zur Datenbank
          </Button>
        </div>
      </div>
    );
  }

  const typeColor = strain.type?.toLowerCase() === 'indica' ? 'purple' :
    strain.type?.toLowerCase() === 'sativa' ? 'yellow' : 'green';

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <div className={`relative h-64 bg-gradient-to-br ${
        typeColor === 'purple' ? 'from-purple-500/30' : 
        typeColor === 'yellow' ? 'from-yellow-500/30' : 
        'from-green-500/30'
      } to-black`}>
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
          <Button 
            variant="ghost" 
            size="icon" 
            className="bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setIsFavorite(!isFavorite);
              toast.success(isFavorite ? 'Entfernt' : 'Zu Favoriten hinzugefügt');
            }}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-white'}`} />
          </Button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent">
          <div className="flex items-end gap-4">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center border-2 ${
              typeColor === 'purple' ? 'bg-purple-500/20 border-purple-500/50' :
              typeColor === 'yellow' ? 'bg-yellow-500/20 border-yellow-500/50' :
              'bg-green-500/20 border-green-500/50'
            }`}>
              <Leaf className={`w-10 h-10 ${
                typeColor === 'purple' ? 'text-purple-400' :
                typeColor === 'yellow' ? 'text-yellow-400' :
                'text-green-400'
              }`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge className={`capitalize ${
                  typeColor === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                  typeColor === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {strain.type || 'Hybrid'}
                </Badge>
                {strain.suitable_for_beginners && (
                  <Badge className="bg-green-500/20 text-green-400">Anfängerfreundlich</Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold text-white">{strain.name}</h1>
              <p className="text-zinc-400">{strain.genetics}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="p-4 bg-zinc-900 rounded-xl text-center">
            <Zap className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-lg font-bold text-white">{strain.thc?.max || '?'}%</p>
            <p className="text-xs text-zinc-500">THC</p>
          </div>
          <div className="p-4 bg-zinc-900 rounded-xl text-center">
            <Droplets className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-lg font-bold text-white">{strain.cbd || '<1%'}</p>
            <p className="text-xs text-zinc-500">CBD</p>
          </div>
          <div className="p-4 bg-zinc-900 rounded-xl text-center">
            <Clock className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <p className="text-lg font-bold text-white">{strain.growing?.flowering_time_days || '?'}</p>
            <p className="text-xs text-zinc-500">Blütetage</p>
          </div>
          <div className="p-4 bg-zinc-900 rounded-xl text-center">
            <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-lg font-bold text-white">{strain.rating?.gesamt || '-'}</p>
            <p className="text-xs text-zinc-500">Bewertung</p>
          </div>
        </div>

        {/* Indica/Sativa Ratio */}
        {(strain.indicaPercent || strain.sativaPercent) && (
          <div className="p-4 bg-zinc-900 rounded-xl">
            <div className="flex justify-between mb-2">
              <span className="text-purple-400 font-medium">Indica {strain.indicaPercent || 0}%</span>
              <span className="text-yellow-400 font-medium">Sativa {strain.sativaPercent || 0}%</span>
            </div>
            <div className="h-3 rounded-full bg-zinc-800 overflow-hidden flex">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-purple-600"
                style={{ width: `${strain.indicaPercent || 50}%` }}
              />
              <div 
                className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                style={{ width: `${strain.sativaPercent || 50}%` }}
              />
            </div>
          </div>
        )}

        {/* Effects */}
        {strain.effects && Object.keys(strain.effects).length > 0 && (
          <div className="p-4 bg-zinc-900 rounded-xl">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Effekte
            </h3>
            <div className="space-y-3">
              {Object.entries(strain.effects).map(([effect, value]) => (
                <div key={effect}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-300 capitalize">{effect}</span>
                    <span className="text-zinc-500">{value}%</span>
                  </div>
                  <Progress value={value} className="h-2" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Flavors & Aromas */}
        {(strain.flavor?.length > 0 || strain.aroma?.length > 0) && (
          <div className="p-4 bg-zinc-900 rounded-xl">
            <h3 className="font-bold text-white mb-4">Geschmack & Aroma</h3>
            <div className="flex flex-wrap gap-2">
              {strain.flavor?.map((f, i) => (
                <Badge key={i} className="bg-pink-500/20 text-pink-400">{f}</Badge>
              ))}
              {strain.aroma?.map((a, i) => (
                <Badge key={i} className="bg-purple-500/20 text-purple-400">{a}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Medical Use */}
        {strain.medical_use && Object.keys(strain.medical_use).length > 0 && (
          <div className="p-4 bg-zinc-900 rounded-xl">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-green-500" />
              Medizinische Anwendung
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(strain.medical_use)
                .filter(([_, active]) => active)
                .map(([use]) => (
                  <Badge key={use} className="bg-green-500/20 text-green-400 capitalize">{use}</Badge>
                ))}
            </div>
          </div>
        )}

        {/* Growing Info */}
        {strain.growing && (
          <div className="p-4 bg-zinc-900 rounded-xl">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Leaf className="w-5 h-5 text-green-500" />
              Anbau-Infos
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {strain.growing.difficulty && (
                <div className="p-3 bg-zinc-800 rounded-lg">
                  <p className="text-xs text-zinc-500 mb-1">Schwierigkeit</p>
                  <p className="text-white capitalize">{strain.growing.difficulty}</p>
                </div>
              )}
              {strain.growing.yield && (
                <div className="p-3 bg-zinc-800 rounded-lg">
                  <p className="text-xs text-zinc-500 mb-1">Ertrag</p>
                  <p className="text-white">{strain.growing.yield}</p>
                </div>
              )}
              {strain.growing.mold_resistance && (
                <div className="p-3 bg-zinc-800 rounded-lg">
                  <p className="text-xs text-zinc-500 mb-1">Schimmelresistenz</p>
                  <p className="text-white capitalize">{strain.growing.mold_resistance}</p>
                </div>
              )}
              {strain.growing.smell_control && (
                <div className="p-3 bg-zinc-800 rounded-lg">
                  <p className="text-xs text-zinc-500 mb-1">Geruchskontrolle</p>
                  <p className="text-white capitalize">{strain.growing.smell_control}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ratings */}
        {strain.rating && (
          <div className="p-4 bg-zinc-900 rounded-xl">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Bewertungen
            </h3>
            <div className="space-y-3">
              {['wirkung', 'geschmack', 'anbau', 'medizinisch', 'preis_leistung'].map(key => (
                strain.rating[key] && (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-300 capitalize">{key.replace('_', '/')}</span>
                      <span className="text-yellow-400">{strain.rating[key]}/5</span>
                    </div>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(i => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i <= strain.rating[key] ? 'text-yellow-500 fill-yellow-500' : 'text-zinc-700'}`} 
                        />
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button className="flex-1 bg-green-600 hover:bg-green-700">
            <Leaf className="w-4 h-4 mr-2" />
            Grow starten
          </Button>
          <Button variant="outline" className="flex-1 border-zinc-700">
            <TrendingUp className="w-4 h-4 mr-2" />
            Bewerten
          </Button>
        </div>
      </div>
    </div>
  );
}