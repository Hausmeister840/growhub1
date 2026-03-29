import { motion, AnimatePresence } from 'framer-motion';
import { X, Home, MapPin, Search, MessageCircle, User, Settings, LogOut, Bell, Bookmark, Calendar, Users, BookOpen, Trophy, Heart, Leaf, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function MobileMenu({ isOpen, onClose, user }) {
  
  // ✅ FIX: Backup Logout
  const handleLogout = async () => {
    try {
      await base44.auth.logout();
      toast.success('Erfolgreich abgemeldet');
      onClose();
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Fehler beim Abmelden');
    }
  };

  const handleBackdropClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  const handleCloseClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  const menuSections = [
    {
      title: 'Navigation',
      items: [
        { label: 'Feed', icon: Home, path: '/Feed' },
        { label: 'Reels', icon: Play, path: '/Reels' },
        { label: 'Map', icon: MapPin, path: '/Map' },
        { label: 'Suche', icon: Search, path: '/Search' },
        { label: 'Nachrichten', icon: MessageCircle, path: '/Messages' },
        { label: 'Profil', icon: User, path: `/Profile?id=${user?.id || ''}` }
      ]
    },
    {
      title: 'Community',
      items: [
        { label: 'Gruppen', icon: Users, path: '/Groups' },
        { label: 'Events', icon: Calendar, path: '/Events' },
        { label: 'Live Streams', icon: Play, path: '/LiveStreams' },
        // { label: 'Marktplatz', icon: ShoppingBag, path: '/Marketplace' } // vorübergehend deaktiviert
      ]
    },
    {
      title: 'Grow',
      items: [
        { label: 'Grow Tagebücher', icon: BookOpen, path: '/GrowDiaries' },
        { label: 'Pflanzenscan', icon: Leaf, path: '/PlantScan' },
        { label: 'Strain Datenbank', icon: Leaf, path: '/Strains' },
        { label: 'Wissen', icon: BookOpen, path: '/Knowledge' },
        { label: 'Erfolge', icon: Trophy, path: '/Achievements' }
      ]
    },
    {
      title: 'Deine Inhalte',
      items: [
        { label: 'Gespeichert', icon: Bookmark, path: '/Saved' },
        { label: 'Gefällt mir', icon: Heart, path: '/Liked' },
        { label: 'Challenges', icon: Trophy, path: '/Challenges' },
        { label: 'Leaderboard', icon: Trophy, path: '/Leaderboard' },
        { label: 'Benachrichtigungen', icon: Bell, path: '/Notifications' },
        { label: 'Hilfe', icon: BookOpen, path: '/Help' },
        { label: 'Einstellungen', icon: Settings, path: '/Settings' }
      ]
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 bg-black/90 z-[200]"
            style={{ touchAction: 'none' }}
          />
          {/* solid dark overlay, no glass blur */}

          {/* MENU PANEL - Glass Design */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-[82vw] max-w-sm bg-[var(--gh-bg-elevated)] border-l border-white/[0.06] z-[201] overflow-y-auto"
            style={{ touchAction: 'pan-y' }}
          >
            {/* Header */}
            <div className="sticky top-0 bg-[var(--gh-bg-elevated)] border-b border-white/[0.04] z-10">
              <div className="flex items-center justify-between p-4">
                <div>
                  <h2 className="text-base font-semibold text-white">Menü</h2>
                  {user && (
                    <p className="text-xs text-[var(--gh-text-muted)]">{user.full_name || user.email}</p>
                  )}
                </div>
                <button
                  onClick={handleCloseClick}
                  className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-[var(--gh-text-muted)] hover:text-white transition-all"
                  aria-label="Menü schließen"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Menu Content */}
            <div className="p-4 space-y-6">
              {menuSections.map((section, idx) => (
                <div key={idx}>
                  <h3 className="text-[10px] font-semibold text-[var(--gh-text-subtle)] uppercase tracking-wider mb-2 px-2">
                    {section.title}
                  </h3>
                  <div className="space-y-0.5">
                    {section.items.map((item, itemIdx) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={itemIdx}
                          to={item.path}
                          onClick={onClose}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--gh-radius-md)] text-[var(--gh-text-secondary)] hover:bg-white/[0.04] hover:text-white transition-all group text-sm"
                        >
                          <Icon className="w-[18px] h-[18px] text-[var(--gh-text-muted)] group-hover:text-[var(--gh-accent)] transition-colors" strokeWidth={1.6} />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Logout */}
              <div className="pt-2 border-t border-white/[0.04]">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--gh-radius-md)] text-[var(--gh-error)] hover:bg-red-500/[0.06] transition-all text-sm"
                  type="button"
                >
                  <LogOut className="w-[18px] h-[18px]" strokeWidth={1.6} />
                  <span className="font-medium">Abmelden</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}