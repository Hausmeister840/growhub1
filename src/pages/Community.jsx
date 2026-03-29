import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  Plus, TrendingUp, MapPin, Users, Sparkles,
  Search, Flame, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

import SpaceCard from '../components/community/SpaceCard';
import CreateSpaceModal from '../components/community/CreateSpaceModal';
import GlassMenu from '../components/community/GlassMenu';
import useLongPress from '../components/contextMenu/useLongPress';

const CATEGORIES = [
  { id: 'all', label: 'Alle', icon: Sparkles },
  { id: 'grow', label: 'Grow', icon: Zap },
  { id: 'strains', label: 'Strains', icon: Flame },
  { id: 'region', label: 'Regional', icon: MapPin },
  { id: 'clubs', label: 'Clubs', icon: Users },
];

export default function Community() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [spaces, setSpaces] = useState([]);
  const [trendingSpaces, setTrendingSpaces] = useState([]);
  const [nearbySpaces, setNearbySpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGlassMenu, setShowGlassMenu] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch {
        setUser(null);
      }
    };
    init();
    loadSpaces();
  }, []);

  const loadSpaces = async () => {
    setLoading(true);
    try {
      const [allSpaces, trending] = await Promise.all([
        base44.entities.CommunitySpace.list('-last_activity', 50),
        base44.entities.CommunitySpace.filter({ is_trending: true }, '-member_count', 10)
      ]);
      
      setSpaces(allSpaces || []);
      setTrendingSpaces(trending || []);
      
      // TODO: Nearby spaces with geo filtering
      setNearbySpaces([]);
    } catch (err) {
      console.error('Load spaces error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSpaces = spaces.filter(space => {
    const matchesCategory = activeCategory === 'all' || space.category === activeCategory;
    const matchesSearch = !searchQuery || 
      space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      space.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleJoinSpace = async (spaceId) => {
    if (!user) {
      toast.error('Bitte melde dich an');
      base44.auth.redirectToLogin();
      return;
    }

    try {
      const space = spaces.find(s => s.id === spaceId);
      if (!space) return;

      const isMember = space.members?.includes(user.email);
      const updatedMembers = isMember
        ? space.members.filter(m => m !== user.email)
        : [...(space.members || []), user.email];

      await base44.entities.CommunitySpace.update(spaceId, {
        members: updatedMembers,
        member_count: updatedMembers.length
      });

      toast.success(isMember ? 'Space verlassen' : 'Space beigetreten!');
      loadSpaces();
    } catch (err) {
      console.error('Join error:', err);
      toast.error('Fehler beim Beitreten');
    }
  };

  const openGlassMenu = useCallback(() => {
    if (!user) {
      toast.error('Bitte melde dich an');
      base44.auth.redirectToLogin();
      return;
    }
    setShowGlassMenu(true);
  }, [user]);

  const longPressHandlers = useLongPress(openGlassMenu, { delay: 500 });

  return (
    <div className="min-h-screen bg-[var(--gh-bg)] pb-20" {...longPressHandlers}>
      {/* Header */}
      <div className="sticky top-[52px] lg:top-0 z-20 gh-glass border-b border-white/[0.04]">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[var(--gh-accent-muted)] rounded-xl flex items-center justify-center">
                <Users className="w-4 h-4 text-[var(--gh-accent)]" />
              </div>
              <h1 className="text-lg font-bold text-white">Community</h1>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--gh-accent-muted)] text-[var(--gh-accent)] hover:bg-[var(--gh-accent)]/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--gh-text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Spaces durchsuchen..."
              className="gh-input pl-9 py-2.5"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`gh-chip ${isActive ? 'gh-chip-active' : ''}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">
        {/* Empty State with Trending/Nearby */}
        {filteredSpaces.length === 0 && !loading && (
          <div className="space-y-6">
            {trendingSpaces.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-[var(--gh-warning)]" />
                  <h2 className="text-white font-bold text-sm">🔥 Trending Spaces</h2>
                </div>
                <div className="grid gap-3">
                  {trendingSpaces.map(space => (
                    <SpaceCard
                      key={space.id}
                      space={space}
                      user={user}
                      onJoin={handleJoinSpace}
                      onClick={() => navigate(createPageUrl('SpaceDetail') + '?id=' + space.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {nearbySpaces.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  <h2 className="text-white font-bold">📍 In deiner Nähe</h2>
                </div>
                <div className="grid gap-3">
                  {nearbySpaces.map(space => (
                    <SpaceCard
                      key={space.id}
                      space={space}
                      user={user}
                      onJoin={handleJoinSpace}
                      onClick={() => navigate(createPageUrl('SpaceDetail') + '?id=' + space.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {trendingSpaces.length === 0 && (
              <div className="text-center py-20 px-6">
                <div className="w-20 h-20 bg-[var(--gh-surface)] rounded-3xl flex items-center justify-center mx-auto mb-5 border border-white/[0.06]">
                  <Users className="w-9 h-9 text-[var(--gh-text-muted)]" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">Noch keine Spaces</h3>
                <p className="text-[var(--gh-text-muted)] text-sm mb-6">Erstelle den ersten Community-Space!</p>
                <button onClick={() => setShowCreateModal(true)} className="gh-btn-primary px-6 py-3 text-sm">
                  Space erstellen
                </button>
              </div>
            )}
          </div>
        )}

        {/* Spaces List */}
        {filteredSpaces.length > 0 && (
          <div className="grid gap-3">
            {filteredSpaces.map(space => (
              <SpaceCard
                key={space.id}
                space={space}
                user={user}
                onJoin={handleJoinSpace}
                onClick={() => navigate(createPageUrl('SpaceDetail') + '?id=' + space.id)}
              />
            ))}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={openGlassMenu}
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 w-14 h-14 rounded-2xl bg-[var(--gh-accent)] hover:bg-[var(--gh-accent-hover)] flex items-center justify-center shadow-2xl shadow-green-500/30 z-40"
      >
        <Plus className="w-6 h-6 text-black" strokeWidth={2.5} />
      </motion.button>

      {/* Modals */}
      <CreateSpaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => {
          setShowCreateModal(false);
          loadSpaces();
        }}
        currentUser={user}
      />

      <GlassMenu
        isOpen={showGlassMenu}
        onClose={() => setShowGlassMenu(false)}
        onCreateSpace={() => {
          setShowGlassMenu(false);
          setShowCreateModal(true);
        }}
      />
    </div>
  );
}