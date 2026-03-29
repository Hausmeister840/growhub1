import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Leaf, Sparkles, Star, TrendingUp, 
  Moon, Sun, Plus, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const STRAIN_TYPES = [
  { id: 'all', label: 'Alle', icon: Leaf, color: 'from-green-500 to-emerald-600' },
  { id: 'indica', label: 'Indica', icon: Moon, color: 'from-purple-500 to-indigo-600' },
  { id: 'sativa', label: 'Sativa', icon: Sun, color: 'from-yellow-500 to-orange-500' },
  { id: 'hybrid', label: 'Hybrid', icon: Sparkles, color: 'from-green-400 to-blue-500' }
];

const EFFECTS = [
  { id: 'relaxed', label: 'Entspannt', emoji: '😌' },
  { id: 'happy', label: 'Glücklich', emoji: '😊' },
  { id: 'euphoric', label: 'Euphorisch', emoji: '🤩' },
  { id: 'creative', label: 'Kreativ', emoji: '🎨' },
  { id: 'focused', label: 'Fokussiert', emoji: '🎯' },
  { id: 'sleepy', label: 'Schläfrig', emoji: '😴' },
  { id: 'hungry', label: 'Hungrig', emoji: '🍕' },
  { id: 'energetic', label: 'Energisch', emoji: '⚡' }
];

const FLAVORS = [
  { id: 'sweet', label: 'Süß', emoji: '🍬' },
  { id: 'earthy', label: 'Erdig', emoji: '🌍' },
  { id: 'citrus', label: 'Zitrus', emoji: '🍋' },
  { id: 'pine', label: 'Kiefer', emoji: '🌲' },
  { id: 'berry', label: 'Beere', emoji: '🫐' },
  { id: 'diesel', label: 'Diesel', emoji: '⛽' },
  { id: 'skunk', label: 'Skunk', emoji: '🦨' },
  { id: 'tropical', label: 'Tropisch', emoji: '🏝️' }
];

export default function Strains() {
  const [strains, setStrains] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedEffects, setSelectedEffects] = useState([]);
  const [selectedFlavors, setSelectedFlavors] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [strainsData, user] = await Promise.all([
        base44.entities.Strain.list('-created_date', 100).catch(() => []),
        base44.auth.me().catch(() => null)
      ]);
      
      setStrains(strainsData || []);
      setCurrentUser(user);
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Fehler beim Laden der Strains');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStrains = strains.filter(strain => {
    const matchesSearch = !searchQuery || 
      strain.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      strain.genetics?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      strain.alias?.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = selectedType === 'all' || 
      strain.type?.toLowerCase() === selectedType;
    
    return matchesSearch && matchesType;
  });

  const featuredStrains = strains.slice(0, 5);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--gh-bg)] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-[var(--gh-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--gh-bg)] pb-20">
      {/* Header */}
      <div className="sticky top-[52px] lg:top-0 z-20 gh-glass border-b border-white/[0.04]">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[var(--gh-accent-muted)] rounded-xl flex items-center justify-center">
                <Leaf className="w-4 h-4 text-[var(--gh-accent)]" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Growpedia</h1>
                <p className="text-[11px] text-[var(--gh-text-muted)]">{strains.length} Sorten</p>
              </div>
            </div>
            {currentUser?.role === 'admin' && (
              <button onClick={() => toast.info('Admin-Funktion')} className="gh-btn-primary text-sm px-4 py-2 flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                Hinzufügen
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--gh-text-muted)]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Strain suchen..."
              className="gh-input pl-9 pr-10"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors ${showFilters ? 'text-[var(--gh-accent)]' : 'text-[var(--gh-text-muted)]'}`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>

          {/* Type Filter */}
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
            {STRAIN_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`gh-chip ${selectedType === type.id ? 'gh-chip-active' : ''}`}
              >
                <type.icon className="w-3.5 h-3.5" />
                {type.label}
              </button>
            ))}
          </div>

          {/* Extended Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-3"
              >
                <div className="space-y-3 p-3 gh-card">
                  <div>
                    <p className="text-xs font-semibold text-[var(--gh-text-muted)] uppercase tracking-wide mb-2">Effekte</p>
                    <div className="flex flex-wrap gap-1.5">
                      {EFFECTS.map(effect => (
                        <button
                          key={effect.id}
                          onClick={() => setSelectedEffects(prev => 
                            prev.includes(effect.id) 
                              ? prev.filter(e => e !== effect.id)
                              : [...prev, effect.id]
                          )}
                          className={`gh-chip text-xs ${selectedEffects.includes(effect.id) ? 'gh-chip-active' : ''}`}
                        >
                          {effect.emoji} {effect.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Featured */}
        {!searchQuery && selectedType === 'all' && featuredStrains.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-[var(--gh-text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[var(--gh-accent)]" />
              Beliebte Sorten
            </h2>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
              {featuredStrains.map(strain => (
                <motion.button
                  key={strain.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(`/StrainDetail?id=${strain.id}`)}
                  className="flex-shrink-0 w-44 p-4 gh-card text-left hover:border-[var(--gh-border-strong)]"
                >
                  <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${
                    strain.type?.toLowerCase() === 'indica' ? 'bg-purple-500/15' :
                    strain.type?.toLowerCase() === 'sativa' ? 'bg-yellow-500/15' :
                    'bg-[var(--gh-accent-muted)]'
                  }`}>
                    <Leaf className={`w-5 h-5 ${
                      strain.type?.toLowerCase() === 'indica' ? 'text-purple-400' :
                      strain.type?.toLowerCase() === 'sativa' ? 'text-yellow-400' :
                      'text-[var(--gh-accent)]'
                    }`} />
                  </div>
                  <h3 className="font-bold text-white text-sm mb-0.5 truncate">{strain.name}</h3>
                  <p className="text-xs text-[var(--gh-text-muted)] mb-2 capitalize">{strain.type || 'Hybrid'}</p>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs text-white font-medium">{strain.rating?.gesamt || '-'}</span>
                    <span className="text-xs text-[var(--gh-text-muted)]">THC {strain.thc?.max || '?'}%</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Strain List */}
        {filteredStrains.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="w-20 h-20 mx-auto mb-5 bg-[var(--gh-surface)] rounded-3xl flex items-center justify-center border border-white/[0.06]">
              <Leaf className="w-9 h-9 text-[var(--gh-text-muted)]" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Keine Sorten gefunden</h2>
            <p className="text-[var(--gh-text-muted)] text-sm">Versuche andere Suchbegriffe</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredStrains.map(strain => (
              <motion.button
                key={strain.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => navigate(`/StrainDetail?id=${strain.id}`)}
                className="w-full flex items-center gap-3.5 p-3.5 gh-card hover:border-[var(--gh-border-strong)] transition-all text-left active:scale-[0.99]"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  strain.type?.toLowerCase() === 'indica' ? 'bg-purple-500/15' :
                  strain.type?.toLowerCase() === 'sativa' ? 'bg-yellow-500/15' :
                  'bg-[var(--gh-accent-muted)]'
                }`}>
                  <Leaf className={`w-6 h-6 ${
                    strain.type?.toLowerCase() === 'indica' ? 'text-purple-400' :
                    strain.type?.toLowerCase() === 'sativa' ? 'text-yellow-400' :
                    'text-[var(--gh-accent)]'
                  }`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-white text-sm truncate">{strain.name}</h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      strain.type?.toLowerCase() === 'indica' ? 'bg-purple-500/15 text-purple-400' :
                      strain.type?.toLowerCase() === 'sativa' ? 'bg-yellow-500/15 text-yellow-400' :
                      'bg-[var(--gh-accent-muted)] text-[var(--gh-accent)]'
                    }`}>
                      {strain.type || 'Hybrid'}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--gh-text-muted)] mb-1.5 truncate">
                    {strain.genetics || 'Unbekannte Genetik'}
                  </p>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-[var(--gh-text-muted)]">THC {strain.thc?.min || '?'}-{strain.thc?.max || '?'}%</span>
                    <span className="text-[var(--gh-text-muted)]">CBD {strain.cbd || '< 1%'}</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-white font-medium">{strain.rating?.gesamt || '-'}</span>
                    </div>
                  </div>
                </div>
                
                <ChevronRight className="w-4 h-4 text-[var(--gh-text-muted)] flex-shrink-0" />
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}