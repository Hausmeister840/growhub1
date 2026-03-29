import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from '@/api/base44Client';
import NotificationBadge from "@/components/notifications/NotificationBadge";
import {
  MessageCircle, Bell, Film, Sprout,
  Users, Plus, LogOut, Settings, Bookmark, Leaf,
  Target, Trophy, Home, Search, Scan
} from "lucide-react";
import { motion } from "framer-motion";
import GrowHubLogo from "../ui/GrowHubLogo";
import SearchOverlay from "../search/SearchOverlay";
import CreateActionSheet from "../grow/CreateActionSheet";

const NAV_ITEMS = [
  { icon: Home, label: "Home", path: "Feed" },
  { icon: Search, label: "Explore", path: "Search" },
  { icon: Film, label: "Reels", path: "Reels" },
  { icon: Sprout, label: "Grow Space", path: "GrowDiaries" },
  { icon: Scan, label: "Pflanzenscan", path: "PlantScan" },
  // { icon: ShoppingBag, label: "Marktplatz", path: "Marketplace" }, // vorübergehend deaktiviert
  { icon: Leaf, label: "Growpedia", path: "Strains" },
  { icon: Users, label: "Community", path: "Community" },
  { icon: Target, label: "Challenges", path: "Challenges" },
  { icon: Trophy, label: "Bestenliste", path: "Leaderboard" },
];

const PERSONAL_ITEMS = [
  { icon: MessageCircle, label: "Nachrichten", path: "Messages", badge: "messages" },
  { icon: Bell, label: "Benachrichtigungen", path: "Notifications", badge: "notifications" },
  { icon: Bookmark, label: "Gespeichert", path: "Saved" },
  { icon: Settings, label: "Einstellungen", path: "Settings" },
];

export default function DesktopNav({ user, currentPageName }) {
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);

  return (
    <>
      <div className="hidden lg:flex fixed top-0 left-0 bottom-0 w-[286px] gh-glass border-r border-white/[0.1] flex-col z-50 shadow-[0_20px_90px_rgba(0,0,0,0.62)]">
        {/* Logo */}
        <div className="px-6 pt-8 pb-5">
          <GrowHubLogo />
        </div>

        {/* Search */}
        <div className="px-4 mb-3">
          <button
            onClick={() => setShowSearch(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-white/[0.03] border border-white/[0.12] rounded-[14px] text-sm text-[var(--gh-text-muted)] hover:text-[var(--gh-text-secondary)] hover:border-white/[0.28] hover:bg-white/[0.08] transition-all"
          >
            <Search className="w-4 h-4 flex-shrink-0" />
            <span>Suche...</span>
            <kbd className="ml-auto text-[10px] px-1.5 py-0.5 bg-white/[0.04] rounded text-[var(--gh-text-subtle)] font-mono hidden xl:inline">⌘K</kbd>
          </button>
        </div>

        {/* Create */}
        <div className="px-4 mb-5">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowActionSheet(true)}
            className="w-full py-2.5 gh-btn-primary flex items-center justify-center gap-2 text-sm shadow-[0_12px_34px_rgba(34,197,94,0.35)]"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Erstellen
          </motion.button>
        </div>

        {/* Main Nav */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-4 custom-scrollbar">
          <p className="text-[10px] font-semibold text-[var(--gh-text-subtle)] uppercase tracking-[0.18em] px-3 mb-2 mt-1">Navigation</p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.path;
            return (
              <Link
                key={item.path}
                to={`/${item.path}`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[14px] transition-all text-sm font-medium ${
                  isActive
                    ? 'bg-gradient-to-r from-[var(--gh-accent)]/24 to-emerald-300/15 text-[var(--gh-accent)] border border-[var(--gh-accent)]/30 shadow-[0_10px_28px_rgba(34,197,94,0.18)]'
                    : 'text-[var(--gh-text-secondary)] hover:bg-white/[0.08] hover:text-white border border-transparent'
                }`}
              >
                <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-[var(--gh-accent)]' : ''}`} strokeWidth={isActive ? 2 : 1.6} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <p className="text-[10px] font-semibold text-[var(--gh-text-subtle)] uppercase tracking-[0.18em] px-3 mb-2 mt-5">Persönlich</p>
          {PERSONAL_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.path;
            return (
              <Link
                key={item.path}
                to={`/${item.path}`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[14px] transition-all text-sm font-medium ${
                  isActive
                    ? 'bg-gradient-to-r from-[var(--gh-accent)]/24 to-emerald-300/15 text-[var(--gh-accent)] border border-[var(--gh-accent)]/30 shadow-[0_10px_28px_rgba(34,197,94,0.18)]'
                    : 'text-[var(--gh-text-secondary)] hover:bg-white/[0.08] hover:text-white border border-transparent'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-[var(--gh-accent)]' : ''}`} strokeWidth={isActive ? 2 : 1.6} />
                  {item.badge && <NotificationBadge type={item.badge} />}
                </div>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* User Footer */}
        <div className="border-t border-white/[0.1] p-3 bg-white/[0.02]">
          {user ? (
            <>
              <button
                onClick={() => navigate(`/Profile?id=${user.id}`)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[14px] hover:bg-white/[0.05] transition-colors text-left mb-1"
              >
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-[1.5px] ring-white/[0.08]" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {user.full_name?.[0] || user.email?.[0] || '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{user.full_name || user.username}</p>
                  <p className="text-xs text-[var(--gh-text-muted)] truncate">@{user.username || user.email?.split('@')[0]}</p>
                </div>
              </button>
              <button
                onClick={() => base44.auth.logout()}
                className="w-full flex items-center gap-3 px-3 py-2 text-[var(--gh-text-muted)] hover:bg-white/[0.05] hover:text-white rounded-[14px] transition-all text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Abmelden</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => base44.auth.redirectToLogin()}
              className="w-full py-2.5 gh-btn-primary text-sm"
            >
              Anmelden
            </button>
          )}
        </div>
      </div>

      <KeyboardShortcut onTrigger={() => setShowSearch(true)} />
      <SearchOverlay isOpen={showSearch} onClose={() => setShowSearch(false)} />
      <CreateActionSheet
        isOpen={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        hasActiveGrows={true}
        onSelectAction={(action) => {
          if (action === 'grow_update') navigate('/GrowDiaries');
        }}
      />
    </>
  );
}

function KeyboardShortcut({ onTrigger }) {
  React.useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onTrigger();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onTrigger]);
  return null;
}