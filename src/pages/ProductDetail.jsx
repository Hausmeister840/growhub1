import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Heart, Share2, Flag, MapPin, Clock, Euro,
  MessageSquare, ChevronLeft, ChevronRight, X, Shield, Edit, Trash2
} from 'lucide-react';
import { toast } from 'sonner';

const categoryConfig = {
  seeds: { label: 'Seeds', icon: '🌱', color: 'from-green-500 to-emerald-600' },
  equipment: { label: 'Grow Equipment', icon: '💡', color: 'from-blue-500 to-cyan-600' },
  nutrients: { label: 'Nährstoffe & Dünger', icon: '💧', color: 'from-cyan-500 to-blue-600' },
  accessories: { label: 'Zubehör', icon: '🔧', color: 'from-purple-500 to-pink-600' },
  merchandise: { label: 'Merchandise', icon: '👕', color: 'from-pink-500 to-rose-600' },
  books: { label: 'Bücher & Medien', icon: '📚', color: 'from-orange-500 to-red-600' },
  other: { label: 'Sonstiges', icon: '📦', color: 'from-zinc-500 to-zinc-700' }
};

const conditionConfig = {
  new: { label: 'Neu', badge: 'Neu', color: 'bg-green-500', description: 'Originalverpackt, unbenutzt' },
  like_new: { label: 'Wie neu', badge: 'Wie neu', color: 'bg-emerald-500', description: 'Kaum benutzt, top Zustand' },
  good: { label: 'Gut', badge: 'Gut erhalten', color: 'bg-blue-500', description: 'Normale Gebrauchsspuren' },
  fair: { label: 'Akzeptabel', badge: 'Gebraucht', color: 'bg-orange-500', description: 'Deutliche Gebrauchsspuren' }
};

export default function ProductDetail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const productId = searchParams.get('id');

  const [product, setProduct] = useState(null);
  const [seller, setSeller] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const loadData = useCallback(async () => {
    if (!productId) {
      navigate(createPageUrl('Marketplace'));
      return;
    }

    setIsLoading(true);
    try {
      const [products, user] = await Promise.all([
        base44.entities.Product.filter({ id: productId }),
        base44.auth.me().catch(() => null)
      ]);

      const fetchedProduct = products?.[0];
      if (!fetchedProduct) {
        toast.error('Produkt nicht gefunden');
        navigate(createPageUrl('Marketplace'));
        return;
      }

      setProduct(fetchedProduct);
      setCurrentUser(user);
      setIsFavorited(fetchedProduct.favorited_by_users?.includes(user?.email));

      // Load seller info
      const allUsers = await base44.entities.User.list();
      const sellerUser = allUsers.find(u => u.email === fetchedProduct.seller_email);
      if (sellerUser) {
        setSeller(sellerUser);
      }
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Fehler beim Laden');
    } finally {
      setIsLoading(false);
    }
  }, [productId, navigate]); // Added navigate to dependencies

  useEffect(() => {
    loadData();
  }, [loadData]); // useEffect now depends on loadData (which itself has productId and navigate)

  const handleFavorite = async () => {
    if (!currentUser) {
      toast.error('Bitte melde dich an');
      return;
    }

    const updatedFavorites = isFavorited
      ? product.favorited_by_users.filter(email => email !== currentUser.email)
      : [...(product.favorited_by_users || []), currentUser.email];

    try {
      await base44.entities.Product.update(productId, { favorited_by_users: updatedFavorites });
      setProduct(prev => ({ ...prev, favorited_by_users: updatedFavorites }));
      setIsFavorited(!isFavorited);
      toast.success(isFavorited ? 'Aus Favoriten entfernt' : 'Zu Favoriten hinzugefügt');
    } catch (error) {
      console.error('Favorite error:', error);
      toast.error('Fehler beim Speichern');
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: product.description,
        url
      }).catch(console.log);
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link kopiert!');
    }
  };

  const handleContactSeller = async () => {
    if (!currentUser) {
      toast.error('Bitte melde dich an');
      return;
    }

    try {
      // Check if conversation already exists
      const allConversations = await base44.entities.Conversation.list();
      const existingConversations = allConversations.filter(c => 
        c.type === 'direct' && 
        c.participants?.includes(currentUser.email) && 
        c.participants?.includes(seller.email)
      );

      let conversationId;
      if (existingConversations.length > 0) {
        conversationId = existingConversations[0].id;
      } else {
        // Create new conversation
        const newConversation = await base44.entities.Conversation.create({
          type: 'direct',
          participants: [currentUser.email, seller.email],
          lastMessage: {
            content: `Interesse an: ${product.title}`,
            senderId: currentUser.id,
            senderName: currentUser.full_name,
            timestamp: new Date().toISOString(),
            type: 'text'
          }
        });
        conversationId = newConversation.id;
      }

      navigate(createPageUrl(`Messages?conversation=${conversationId}`));
    } catch (error) {
      console.error('Contact error:', error);
      toast.error('Fehler beim Erstellen der Unterhaltung');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Produkt wirklich löschen?')) return;

    try {
      await base44.entities.Product.delete(productId);
      toast.success('Produkt gelöscht');
      navigate(createPageUrl('Marketplace'));
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Fehler beim Löschen');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500" />
      </div>
    );
  }

  if (!product) return null;

  const category = categoryConfig[product.category] || categoryConfig.other;
  const condition = conditionConfig[product.condition] || conditionConfig.fair;
  const isOwn = currentUser && product.seller_email === currentUser.email;
  const hasImages = product.image_urls && product.image_urls.length > 0;

  return (
    <div className="min-h-screen bg-black">
      {/* Back Button */}
      <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button
            onClick={() => navigate(createPageUrl('Marketplace'))}
            variant="ghost"
            className="text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Zurück zum Marketplace
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div
              className="relative aspect-square rounded-3xl overflow-hidden bg-zinc-900/50 cursor-pointer glass-card border border-zinc-800/50"
              onClick={() => setShowImageViewer(true)}
            >
              {hasImages ? (
                <>
                  <img
                    src={product.image_urls[currentImageIndex]}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                  {product.image_urls.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex((prev) =>
                            prev === 0 ? product.image_urls.length - 1 : prev - 1
                          );
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition-all"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex((prev) =>
                            prev === product.image_urls.length - 1 ? 0 : prev + 1
                          );
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition-all"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {product.image_urls.map((_, index) => (
                          <button
                            key={index}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex(index);
                            }}
                            className={`w-2 h-2 rounded-full transition-all ${
                              index === currentImageIndex
                                ? 'bg-white w-6'
                                : 'bg-white/50 hover:bg-white/75'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl">
                  {category.icon}
                </div>
              )}
            </div>

            {/* Thumbnail Grid */}
            {hasImages && product.image_urls.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.image_urls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-square rounded-xl overflow-hidden glass-card border-2 transition-all ${
                      index === currentImageIndex
                        ? 'border-green-500'
                        : 'border-zinc-800/50 hover:border-zinc-700'
                    }`}
                  >
                    <img src={url} alt={`${product.title} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div className="space-y-6">
            {/* Status & Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {product.status === 'sold' ? (
                  <Badge className="bg-red-500 text-white">✓ Verkauft</Badge>
                ) : product.status === 'reserved' ? (
                  <Badge className="bg-orange-500 text-white">🔒 Reserviert</Badge>
                ) : (
                  <Badge className="bg-green-500 text-black font-bold">✓ Verfügbar</Badge>
                )}
                {product.is_trade && (
                  <Badge className="bg-purple-500 text-white">🔄 Tausch möglich</Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!isOwn && (
                  <Button
                    onClick={handleFavorite}
                    variant="ghost"
                    size="icon"
                    className={`rounded-full ${isFavorited ? 'text-red-500' : 'text-zinc-400'}`}
                  >
                    <Heart className={`w-6 h-6 ${isFavorited ? 'fill-current' : ''}`} />
                  </Button>
                )}
                <Button
                  onClick={handleShare}
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-zinc-400"
                >
                  <Share2 className="w-6 h-6" />
                </Button>
                {!isOwn && (
                  <Button
                    onClick={() => {
                      toast.info('🚨 Report-Funktion kommt bald!', { duration: 3000 });
                    }}
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-zinc-400 hover:text-red-500"
                  >
                    <Flag className="w-6 h-6" />
                  </Button>
                )}
                {isOwn && (
                  <>
                    <Button
                      onClick={() => navigate(createPageUrl(`EditProduct?id=${productId}`))}
                      variant="ghost"
                      size="icon"
                      className="rounded-full text-zinc-400"
                    >
                      <Edit className="w-6 h-6" />
                    </Button>
                    <Button
                      onClick={handleDelete}
                      variant="ghost"
                      size="icon"
                      className="rounded-full text-red-400"
                    >
                      <Trash2 className="w-6 h-6" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Title & Category */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="border-zinc-700">
                  {category.icon} {category.label}
                </Badge>
                <Badge className={`${condition.color} text-white`}>
                  {condition.badge}
                </Badge>
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {product.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-zinc-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {new Date(product.created_date).toLocaleDateString('de-DE')}
                </div>
                {product.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {product.location}
                  </div>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="glass-card rounded-2xl p-6 border border-zinc-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Preis</p>
                  <div className="flex items-center gap-2">
                    <Euro className="w-8 h-8 text-green-400" />
                    <span className="text-5xl font-bold text-white">
                      {product.price}
                    </span>
                  </div>
                </div>
                {product.is_trade && (
                  <div className="text-right">
                    <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/50">
                      🔄 Tausch möglich
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Seller */}
            {!isOwn && product.status === 'available' && (
              <div className="space-y-3">
                <Button
                  onClick={handleContactSeller}
                  className="w-full bg-green-500 hover:bg-green-600 text-black font-bold rounded-2xl py-6 text-lg"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Verkäufer kontaktieren
                </Button>
                <p className="text-xs text-center text-zinc-500">
                  Kostenlos & sicher über GrowHub Messenger
                </p>
              </div>
            )}

            {/* Seller Info */}
            {seller && (
              <div
                className="glass-card rounded-2xl p-4 border border-zinc-800/50 cursor-pointer hover:border-green-500/50 transition-all"
                onClick={() => navigate(createPageUrl(`Profile?id=${seller.id}`))}
              >
                <div className="flex items-center gap-4">
                  {seller.avatar_url ? (
                    <img src={seller.avatar_url} alt={seller.full_name} className="w-16 h-16 rounded-full" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold">
                      {seller.full_name?.charAt(0) || seller.email?.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-bold text-white">{seller.full_name || 'User'}</p>
                    <p className="text-sm text-zinc-400">@{seller.username || seller.email?.split('@')[0]}</p>
                    {seller.is_verified_seller && (
                      <Badge className="bg-green-500/20 text-green-400 border border-green-500/50 mt-1">
                        <Shield className="w-3 h-3 mr-1" />
                        Verifiziert
                      </Badge>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-500" />
                </div>
              </div>
            )}

            {/* Description */}
            <div className="glass-card rounded-2xl p-6 border border-zinc-800/50">
              <h3 className="font-bold text-white text-lg mb-3">Beschreibung</h3>
              <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {product.description || 'Keine Beschreibung vorhanden.'}
              </p>
            </div>

            {/* Condition Details */}
            <div className="glass-card rounded-2xl p-6 border border-zinc-800/50">
              <h3 className="font-bold text-white text-lg mb-3">Zustand</h3>
              <div className="flex items-center gap-3 mb-2">
                <Badge className={`${condition.color} text-white`}>
                  {condition.label}
                </Badge>
              </div>
              <p className="text-sm text-zinc-400">
                {condition.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Viewer */}
      <AnimatePresence>
        {showImageViewer && hasImages && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center"
            onClick={() => setShowImageViewer(false)}
          >
            <button
              onClick={() => setShowImageViewer(false)}
              className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="relative w-full h-full flex items-center justify-center p-4">
              <img
                src={product.image_urls[currentImageIndex]}
                alt={product.title}
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />

              {product.image_urls.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((prev) =>
                        prev === 0 ? product.image_urls.length - 1 : prev - 1
                      );
                    }}
                    className="absolute left-4 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 transition-all"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((prev) =>
                        prev === product.image_urls.length - 1 ? 0 : prev + 1
                      );
                    }}
                    className="absolute right-4 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 transition-all"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}