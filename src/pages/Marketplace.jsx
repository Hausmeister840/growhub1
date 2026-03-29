import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, MapPin, Heart, Package, ShoppingBag,
  Sparkles, SlidersHorizontal, X, Clock, Euro,
  Grid3x3, List, MessageCircle, Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ProductCardSkeleton } from '../components/ui/LoadingSkeleton';


const categoryConfig = {
  seeds: { 
    label: 'Seeds', 
    icon: '🌱', 
    color: 'from-green-500 to-emerald-600',
    description: 'Cannabis Seeds & Genetics'
  },
  equipment: { 
    label: 'Grow Equipment', 
    icon: '💡', 
    color: 'from-blue-500 to-cyan-600',
    description: 'Lampen, Zelte, Lüftung'
  },
  nutrients: { 
    label: 'Nährstoffe & Dünger', 
    icon: '💧', 
    color: 'from-cyan-500 to-blue-600',
    description: 'Dünger, Booster, Substrate'
  },
  accessories: { 
    label: 'Zubehör', 
    icon: '🔧', 
    color: 'from-purple-500 to-pink-600',
    description: 'Tools & Accessories'
  },
  merchandise: { 
    label: 'Merchandise', 
    icon: '👕', 
    color: 'from-pink-500 to-rose-600',
    description: 'Clothing & Lifestyle'
  },
  books: { 
    label: 'Bücher & Medien', 
    icon: '📚', 
    color: 'from-orange-500 to-red-600',
    description: 'Wissen & Literatur'
  },
  other: { 
    label: 'Sonstiges', 
    icon: '📦', 
    color: 'from-zinc-500 to-zinc-700',
    description: 'Alles andere'
  }
};

const conditionConfig = {
  new: { label: 'Neu', badge: 'Neu', color: 'bg-green-500' },
  like_new: { label: 'Wie neu', badge: 'Wie neu', color: 'bg-emerald-500' },
  good: { label: 'Gut', badge: 'Gut erhalten', color: 'bg-blue-500' },
  fair: { label: 'Akzeptabel', badge: 'Gebraucht', color: 'bg-orange-500' }
};

const ProductCard = ({ product, onFavorite, isFavorited, onContactSeller, currentUser, viewMode }) => {
  const navigate = useNavigate();
  const [contacting, setContacting] = React.useState(false);
  const category = categoryConfig[product.category] || categoryConfig.other;
  const condition = conditionConfig[product.condition] || conditionConfig.fair;
  const isOwn = currentUser && product.seller_email === currentUser.email;
  
  const isNew = new Date() - new Date(product.created_date) < 24 * 60 * 60 * 1000;
  const hasImages = product.image_urls && product.image_urls.length > 0;

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="group cursor-pointer"
        onClick={() => navigate(`/ProductDetail?id=${product.id}`)}
      >
        <div className="gh-card overflow-hidden p-4 hover:border-[var(--gh-accent)]/20 transition-all duration-300">
          <div className="flex gap-4">
            <div className="relative w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden bg-zinc-900/50">
              {hasImages ? (
                <img
                  src={product.image_urls[0]}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">
                  {category.icon}
                </div>
              )}
              
              {product.status === 'sold' && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                  <Badge className="bg-red-500 text-white">Verkauft</Badge>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-white line-clamp-1 group-hover:text-green-400 transition-colors">
                    {product.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs border-zinc-700">
                      {category.label}
                    </Badge>
                    <Badge className={`${condition.color} text-white text-xs border-0`}>
                      {condition.badge}
                    </Badge>
                    {isNew && (
                      <Badge className="bg-yellow-500 text-black text-xs border-0 font-bold">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Neu
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-1 text-green-400 font-bold text-2xl">
                    <Euro className="w-5 h-5" />
                    {product.price}
                  </div>
                  {product.location && (
                    <div className="flex items-center gap-1 text-xs text-zinc-400 mt-1">
                      <MapPin className="w-3 h-3" />
                      {product.location}
                    </div>
                  )}
                </div>
              </div>

              <p className="text-sm text-zinc-400 line-clamp-2 mb-3">
                {product.description}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Clock className="w-3 h-3" />
                  {new Date(product.created_date).toLocaleDateString('de-DE')}
                </div>
                
                <div className="flex items-center gap-1">
                  {currentUser && !isOwn && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        setContacting(true);
                        await onContactSeller(product);
                        setContacting(false);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--gh-accent-muted)] text-[var(--gh-accent)] text-xs font-medium hover:bg-[var(--gh-accent)]/20 transition-colors"
                    >
                      {contacting ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageCircle className="w-3 h-3" />}
                      Kontakt
                    </button>
                  )}
                  {currentUser && !isOwn && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onFavorite(product.id); }}
                      className={`p-1.5 rounded-full transition-colors ${isFavorited ? 'text-red-500' : 'text-[var(--gh-text-muted)] hover:text-red-400'}`}
                    >
                      <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className="group cursor-pointer h-full"
      onClick={() => navigate(`/ProductDetail?id=${product.id}`)}
    >
      <div className="gh-card overflow-hidden h-full flex flex-col hover:border-[var(--gh-accent)]/20 transition-all duration-300">
        <div className="relative aspect-square bg-zinc-900/50 overflow-hidden">
          {hasImages ? (
            <>
              <img
                src={product.image_urls[0]}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {product.image_urls.length > 1 && (
                <div className="absolute bottom-3 right-3">
                  <Badge className="bg-black/80 text-white border-0 backdrop-blur-md">
                    +{product.image_urls.length - 1} Fotos
                  </Badge>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              {category.icon}
            </div>
          )}

          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.status === 'sold' ? (
              <Badge className="bg-red-500/90 text-white border-0 backdrop-blur-md font-bold">
                ✓ Verkauft
              </Badge>
            ) : product.status === 'reserved' ? (
              <Badge className="bg-orange-500/90 text-white border-0 backdrop-blur-md font-bold">
                🔒 Reserviert
              </Badge>
            ) : (
              <Badge className="bg-green-500/90 text-white border-0 backdrop-blur-md font-bold">
                ✓ Verfügbar
              </Badge>
            )}
            
            {isNew && (
              <Badge className="bg-yellow-500/90 text-black border-0 backdrop-blur-md font-bold">
                <Sparkles className="w-3 h-3 mr-1" />
                Neu
              </Badge>
            )}
          </div>

          {currentUser && !isOwn && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onFavorite(product.id);
              }}
              className={`absolute top-3 right-3 w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
                isFavorited
                  ? 'bg-red-500 text-white'
                  : 'bg-black/40 text-white hover:bg-black/60'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
            </motion.button>
          )}

          {product.is_trade && (
            <div className="absolute bottom-3 left-3">
              <Badge className="bg-purple-500/90 text-white border-0 backdrop-blur-md font-bold">
                🔄 Tausch möglich
              </Badge>
            </div>
          )}
        </div>

        <div className="p-4 space-y-3 flex-1 flex flex-col">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs border-zinc-700">
              {category.icon} {category.label}
            </Badge>
            <Badge className={`${condition.color} text-white text-xs border-0`}>
              {condition.badge}
            </Badge>
          </div>

          <h3 className="font-bold text-lg text-white line-clamp-2 group-hover:text-green-400 transition-colors flex-1">
            {product.title}
          </h3>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50">
            <div className="flex items-center gap-1">
              <Euro className="w-5 h-5 text-green-400" />
              <span className="text-2xl font-bold text-white">
                {product.price}
              </span>
            </div>
            {product.location && (
              <div className="flex items-center gap-1 text-xs text-zinc-400">
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-[100px]">{product.location}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/50">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {product.seller_email?.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-zinc-400 truncate flex-1">
              {product.seller_email?.split('@')[0]}
            </span>
            {currentUser && !isOwn ? (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  setContacting(true);
                  await onContactSeller(product);
                  setContacting(false);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--gh-accent-muted)] text-[var(--gh-accent)] text-xs font-medium hover:bg-[var(--gh-accent)]/20 transition-colors flex-shrink-0"
              >
                {contacting ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageCircle className="w-3 h-3" />}
                Kontakt
              </button>
            ) : (
              <div className="flex items-center gap-1 text-xs text-zinc-500">
                <Clock className="w-3 h-3" />
                {new Date(product.created_date).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function Marketplace() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [showTradeOnly, setShowTradeOnly] = useState(false);
  const [showAvailableOnly, setShowAvailableOnly] = useState(true);
  const [locationFilter, setLocationFilter] = useState('');
  
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedProducts, user] = await Promise.all([
        base44.entities.Product.list('-created_date', 100),
        base44.auth.me().catch(() => null)
      ]);
      
      setProducts(fetchedProducts || []);
      setFilteredProducts(fetchedProducts || []);
      setCurrentUser(user);
    } catch (error) {
      console.error('Marketplace load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...products];

    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (selectedCondition !== 'all') {
      filtered = filtered.filter(p => p.condition === selectedCondition);
    }

    filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    if (showTradeOnly) {
      filtered = filtered.filter(p => p.is_trade);
    }

    if (showAvailableOnly) {
      filtered = filtered.filter(p => p.status === 'available');
    }

    if (locationFilter) {
      filtered = filtered.filter(p =>
        p.location?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    switch (sortBy) {
      case 'price_low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
        filtered.sort((a, b) => (b.favorited_by_users?.length || 0) - (a.favorited_by_users?.length || 0));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
        break;
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, selectedCategory, selectedCondition, priceRange, showTradeOnly, showAvailableOnly, locationFilter, sortBy]);

  const handleFavorite = useCallback(async (productId) => {
    if (!currentUser) {
      toast.error('Bitte melde dich an');
      return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) return;

    const isFavorited = product.favorited_by_users?.includes(currentUser.email);

    const updatedFavorites = isFavorited
      ? product.favorited_by_users.filter(email => email !== currentUser.email)
      : [...(product.favorited_by_users || []), currentUser.email];

    try {
      await base44.entities.Product.update(productId, { favorited_by_users: updatedFavorites });
      setProducts(prev => prev.map(p =>
        p.id === productId ? { ...p, favorited_by_users: updatedFavorites } : p
      ));
      toast.success(isFavorited ? '❤️ Aus Favoriten entfernt' : '❤️ Zu Favoriten hinzugefügt');
    } catch (error) {
      console.error('Favorite error:', error);
      toast.error('Fehler beim Favorisieren');
    }
  }, [currentUser, products]);

  const handleContactSeller = useCallback(async (product) => {
    if (!currentUser) {
      toast.error('Bitte melde dich an');
      return;
    }
    if (!product.seller_email) {
      toast.error('Verkäufer nicht verfügbar');
      return;
    }
    // Find seller user by email to get their ID
    try {
      const users = await base44.entities.User.filter({ email: product.seller_email }, '-created_date', 1);
      const seller = users?.[0];
      if (!seller) {
        toast.error('Verkäufer nicht gefunden');
        return;
      }
      // Check for existing conversation first
      const existingConvs = await base44.entities.Conversation.list('-updated_date', 100);
      const existing = existingConvs.find(c =>
        c.type === 'direct' &&
        c.participants?.length === 2 &&
        c.participants.includes(currentUser.id) &&
        c.participants.includes(seller.id)
      );
      if (existing) {
        navigate(`/Messages?conv=${existing.id}`);
        return;
      }
      // Create new conversation with initial message about the product
      const participants = [currentUser.id, seller.id];
      const conv = await base44.entities.Conversation.create({
        type: 'direct',
        participants,
        admins: [],
        unreadCount: Object.fromEntries(participants.map(id => [id, 0])),
        isPinned: {},
        isMuted: {},
        isArchived: {},
      });
      // Send initial product inquiry message
      const senderName = currentUser.full_name || currentUser.username || currentUser.email?.split('@')[0];
      await base44.entities.Message.create({
        conversationId: conv.id,
        senderId: currentUser.id,
        senderName,
        type: 'text',
        content: `Hallo! Ich interessiere mich für dein Inserat: "${product.title}" (€${product.price}). Ist es noch verfügbar?`,
        status: 'sent',
      });
      navigate(`/Messages?conv=${conv.id}`);
    } catch (err) {
      console.error('Contact seller error:', err);
      toast.error('Fehler beim Öffnen des Chats');
    }
  }, [currentUser, navigate]);

  const activeFiltersCount = [
    selectedCategory !== 'all' ? 1 : 0,
    selectedCondition !== 'all' ? 1 : 0,
    priceRange[0] > 0 || priceRange[1] < 1000 ? 1 : 0,
    showTradeOnly ? 1 : 0,
    locationFilter ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  const categoryStats = Object.keys(categoryConfig).map(key => ({
    key,
    count: products.filter(p => p.category === key).length
  }));

  return (
    <div className="min-h-screen bg-[var(--gh-bg)]">
      {/* Sticky Header */}
      <div className="sticky top-[52px] lg:top-0 z-20 gh-glass border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[var(--gh-accent-muted)] rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-[var(--gh-accent)]" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Marktplatz</h1>
                <p className="text-[11px] text-[var(--gh-text-muted)]">{filteredProducts.length} Produkte · {new Set(products.map(p => p.seller_email)).size} Verkäufer</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1">
                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-[var(--gh-accent)] text-black' : 'text-[var(--gh-text-muted)]'}`}>
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-[var(--gh-accent)] text-black' : 'text-[var(--gh-text-muted)]'}`}>
                  <List className="w-4 h-4" />
                </button>
              </div>
              {currentUser && (
                <button onClick={() => navigate('/CreateProduct')} className="gh-btn-primary flex items-center gap-1.5 text-sm px-4 py-2">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Verkaufen</span>
                </button>
              )}
            </div>
          </div>

          {/* Search Row */}
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--gh-text-muted)]" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Produkte durchsuchen..."
                className="gh-input pl-9"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative flex items-center gap-2 px-3.5 py-2.5 rounded-[var(--gh-radius-lg)] border text-sm font-medium transition-all ${showFilters ? 'border-[var(--gh-accent)]/40 bg-[var(--gh-accent-muted)] text-[var(--gh-accent)]' : 'border-white/[0.06] bg-white/[0.03] text-[var(--gh-text-secondary)] hover:text-white'}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[var(--gh-accent)] text-black text-[9px] font-bold rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white/[0.03] border border-white/[0.06] rounded-[var(--gh-radius-lg)] px-3 text-sm text-white cursor-pointer hover:border-[var(--gh-accent)]/30 transition-colors"
            >
              <option value="newest">Neueste</option>
              <option value="price_low">Preis ↑</option>
              <option value="price_high">Preis ↓</option>
              <option value="popular">Beliebt</option>
            </select>
          </div>

          {/* Category Chips */}
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`gh-chip ${selectedCategory === 'all' ? 'gh-chip-active' : ''}`}
            >
              Alle <span className="opacity-60 text-[10px]">{products.length}</span>
            </button>
            {categoryStats.map(({ key, count }) => {
              const config = categoryConfig[key];
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`gh-chip ${selectedCategory === key ? 'gh-chip-active' : ''}`}
                >
                  {config.icon} {config.label} <span className="opacity-60 text-[10px]">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-white/[0.04] overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setSelectedCondition('all')} className={`gh-chip ${selectedCondition === 'all' ? 'gh-chip-active' : ''}`}>Alle</button>
                {Object.entries(conditionConfig).map(([key, config]) => (
                  <button key={key} onClick={() => setSelectedCondition(key)} className={`gh-chip ${selectedCondition === key ? 'gh-chip-active' : ''}`}>{config.label}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="number" value={priceRange[0]} onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])} className="gh-input w-32 text-sm" placeholder="€ Von" />
                <input type="number" value={priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 1000])} className="gh-input w-32 text-sm" placeholder="€ Bis" />
                <button onClick={() => setShowAvailableOnly(!showAvailableOnly)} className={`gh-chip ${showAvailableOnly ? 'gh-chip-active' : ''}`}>✓ Verfügbar</button>
                <button onClick={() => setShowTradeOnly(!showTradeOnly)} className={`gh-chip ${showTradeOnly ? 'bg-purple-500 text-white border-purple-500' : ''}`}>🔄 Tausch</button>
                {activeFiltersCount > 0 && (
                  <button onClick={() => { setSelectedCategory('all'); setSelectedCondition('all'); setPriceRange([0, 1000]); setShowTradeOnly(false); setLocationFilter(''); setShowAvailableOnly(true); }} className="gh-chip text-red-400 border-red-500/30 hover:bg-red-500/10">
                    <X className="w-3.5 h-3.5" /> Zurücksetzen
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
          }>
            {[...Array(8)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="w-20 h-20 mx-auto mb-5 bg-[var(--gh-surface)] rounded-3xl flex items-center justify-center border border-white/[0.06]">
              <Package className="w-9 h-9 text-[var(--gh-text-muted)]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Keine Produkte gefunden</h3>
            <p className="text-[var(--gh-text-muted)] text-sm mb-6">
              {searchQuery ? `Keine Ergebnisse für "${searchQuery}"` : 'Versuche andere Filter'}
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedCondition('all'); setPriceRange([0, 1000]); setShowTradeOnly(false); setLocationFilter(''); }} className="gh-btn-primary px-5 py-2.5 text-sm">
                Filter zurücksetzen
              </button>
              {currentUser && (
                <button onClick={() => navigate('/CreateProduct')} className="gh-btn-ghost px-5 py-2.5 text-sm border border-white/[0.06] rounded-[var(--gh-radius-lg)]">
                  <Plus className="w-4 h-4 inline mr-1.5" />
                  Produkt erstellen
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-[var(--gh-text-muted)]">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'Produkt' : 'Produkte'} gefunden
              </p>
            </div>

            <motion.div
              layout
              className={
                viewMode === 'grid'
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              }
            >
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onFavorite={handleFavorite}
                  onContactSeller={handleContactSeller}
                  isFavorited={product.favorited_by_users?.includes(currentUser?.email)}
                  currentUser={currentUser}
                  viewMode={viewMode}
                />
              ))}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}