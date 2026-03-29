import React from 'react';
import { Search, MessageCircle } from 'lucide-react';
import NotificationButton from '../notifications/NotificationButton';
import NotificationBadge from '../notifications/NotificationBadge';
import GrowHubLogo from '../ui/GrowHubLogo';
import { Link } from 'react-router-dom';

const PAGE_TITLES = {
  Feed: null, // Shows logo
  Map: 'Radar',
  Reels: 'Reels',
  GrowDiaries: 'Grow Tagebuch',
  GrowDiaryDetail: 'Grow Tagebuch',
  Groups: 'Community',
  Community: 'Community',
  Marketplace: 'Marktplatz',
  Strains: 'Growpedia',
  Messages: 'Nachrichten',
  Notifications: 'Benachrichtigungen',
  Saved: 'Gespeichert',
  Settings: 'Einstellungen',
  Profile: 'Profil',
  Challenges: 'Challenges',
  Leaderboard: 'Bestenliste',
  Search: 'Explore',
  Help: 'Hilfe',
};

export default function MobileHeader({ user, currentPageName, onMenuClick, hidden }) {
  const pageTitle = PAGE_TITLES[currentPageName];
  const showLogo = pageTitle === null || pageTitle === undefined;


  return (
    <>
      <header 
        className={`lg:hidden fixed top-0 left-0 right-0 z-40 transition-transform duration-300 ${hidden ? '-translate-y-full' : 'translate-y-0'}`}
      >
        {/* Glass background */}
        <div className="absolute inset-0 gh-glass border-b border-white/[0.08]" />
        
        <div className="relative flex items-center justify-between h-13 px-4 py-2.5">
          {/* Left: Logo or Title */}
          {showLogo ? (
            <Link to="/Feed" className="flex items-center">
              <GrowHubLogo size="small" />
            </Link>
          ) : (
            <h1 className="text-[15px] font-semibold text-white tracking-tight">{pageTitle}</h1>
          )}

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            <Link
              to="/Search"
            className="w-9 h-9 flex items-center justify-center rounded-full text-[var(--gh-text-secondary)] hover:text-white hover:bg-white/[0.08] transition-all"
              aria-label="Suche"
            >
              <Search className="w-[19px] h-[19px]" strokeWidth={1.8} />
            </Link>

            {user && (
              <>
                <Link
                  to="/Messages"
                  className="relative w-9 h-9 flex items-center justify-center rounded-full text-[var(--gh-text-secondary)] hover:text-white hover:bg-white/[0.08] transition-all"
                  aria-label="Nachrichten"
                >
                  <MessageCircle className="w-[19px] h-[19px]" strokeWidth={1.8} />
                  <NotificationBadge type="messages" />
                </Link>
                <React.Suspense fallback={null}>
                  <NotificationButton currentUser={user} />
                </React.Suspense>
              </>
            )}

            <button
              onClick={onMenuClick}
              className="ml-0.5 w-9 h-9 flex items-center justify-center"
              aria-label="Menü"
            >
              {user?.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt="" 
                  className="w-7 h-7 rounded-full object-cover ring-[1.5px] ring-white/[0.12]" 
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold text-[11px]">
                  {user?.full_name?.[0] || user?.email?.[0] || '?'}
                </div>
              )}
            </button>
          </div>
        </div>
      </header>


    </>
  );
}