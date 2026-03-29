import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import AppErrorBoundary from "@/components/ui/AppErrorBoundary";
import GlobalErrorBoundary from "@/components/ui/GlobalErrorBoundary";
import { ToastProvider } from "@/components/ui/ToastSystem";
import { toast } from "sonner";
import '@/components/utils/errorSuppressor';

import { UserStoreProvider } from "@/components/stores/useUserStore";
import { UIStoreProvider } from "@/components/stores/useUIStore";
import { usePresence } from "@/components/hooks/usePresence";
import ContextMenuProvider from "@/components/contextMenu/ContextMenuProvider";
import useScrollDirection from "@/components/hooks/useScrollDirection";

import DesktopNav from "@/components/layout/DesktopNav";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import MobileHeader from "@/components/layout/MobileHeader";

// Lazy-load non-critical components
const MobileMenu = React.lazy(() => import("@/components/layout/MobileMenu"));
const CreatePost = React.lazy(() => import("@/components/feed/CreatePost"));
const CookieBanner = React.lazy(() => import("@/components/legal/CookieBanner"));
const PWAInstallPrompt = React.lazy(() => import("@/components/pwa/PWAInstallPrompt"));
const UpdateNotification = React.lazy(() => import("@/components/pwa/UpdateNotification"));
const PushNotificationManager = React.lazy(() => import("@/components/notifications/PushNotificationManager"));
const OfflineQueue = React.lazy(() => import("@/components/offline/OfflineQueue"));
const NetworkIndicator = React.lazy(() => import("@/components/ui/NetworkIndicator"));

const NO_NAV_PAGES = ['PostThread', 'MobileMigration', 'AgeGate', 'Onboarding', 'Reels', 'CreateStory', 'PlantScan', 'Login'];
const NO_BOTTOM_PAD_PAGES = ['Messages'];
const FULL_WIDTH_PAGES = ['Map', 'Messages', 'Reels', 'CreateStory', 'PlantScan'];
const PUBLIC_PAGES = ['AgeGate', 'Privacy', 'Terms', 'Feed', 'Reels', 'Strains', 'StrainDetail', 'Login'];
const ADMIN_ONLY_PAGES = ['AdminDashboard', 'ModerationQueue', 'AdminZoneManager', 'AdminUserCheck', 'AuditDashboard', 'FeedDiagnostics', 'SystemCheck'];

// Tabs that should have their scroll position preserved when switching back
const SCROLL_PERSIST_TABS = ['Feed', 'Map', 'Messages'];

// Global scroll position store (survives re-renders)
const scrollPositions = {};

export default function Layout({ children, currentPageName }) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [enableDeferredUI, setEnableDeferredUI] = useState(false);
  const { user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings, navigateToLogin } = useAuth();
  
  const navigate = useNavigate();
  const location = useLocation();
  const navHidden = useScrollDirection(10);
  const prevPageRef = React.useRef(currentPageName);
  
  // Track user presence
  usePresence(user);

  // Persist scroll position for designated tabs when navigating away, restore on return
  useEffect(() => {
    const prev = prevPageRef.current;

    // Save scroll of the page we're leaving
    if (SCROLL_PERSIST_TABS.includes(prev)) {
      scrollPositions[prev] = window.scrollY;
    }

    // Restore scroll of the page we're entering (after paint)
    if (SCROLL_PERSIST_TABS.includes(currentPageName) && scrollPositions[currentPageName] != null) {
      const saved = scrollPositions[currentPageName];
      requestAnimationFrame(() => { window.scrollTo(0, saved); });
    } else if (!SCROLL_PERSIST_TABS.includes(currentPageName)) {
      window.scrollTo(0, 0);
    }

    prevPageRef.current = currentPageName;
  }, [currentPageName]);

  // Close all overlays/modals on route change
  useEffect(() => {
    window.dispatchEvent(new Event('routeChange'));
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    setShowMobileMenu(false);
    setShowCreatePost(false);
  }, [location.pathname]);

  // iOS Safe-Area & Viewport Fix
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
    
    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);

  useEffect(() => {
    if (isLoadingAuth || isLoadingPublicSettings) return;

    if (!isAuthenticated && !PUBLIC_PAGES.includes(currentPageName)) {
      navigate('/Login', { replace: true });
      return;
    }

    if (isAuthenticated && user && !user.username && currentPageName !== 'Onboarding' && currentPageName !== 'AgeGate') {
      navigate('/Onboarding', { replace: true });
      return;
    }

    if (ADMIN_ONLY_PAGES.includes(currentPageName) && user?.role !== 'admin') {
      toast.error('Zugriff verweigert');
      navigate('/Feed', { replace: true });
    }
  }, [
    isLoadingAuth,
    isLoadingPublicSettings,
    isAuthenticated,
    user,
    currentPageName,
    navigate,
    navigateToLogin,
  ]);

  useEffect(() => {
    const handleOpenCreate = () => {
      if (!user) {
        toast.error('Bitte melde dich an');
        navigateToLogin();
        return;
      }
      setShowCreatePost(true);
    };

    window.addEventListener('openCreatePost', handleOpenCreate);
    
    // Cleanup function to prevent memory leaks
    return () => {
      window.removeEventListener('openCreatePost', handleOpenCreate);
    };
  }, [user, navigate, navigateToLogin]);

  useEffect(() => {
    const enableUI = () => setEnableDeferredUI(true);

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const id = window.requestIdleCallback(enableUI, { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }

    const timeoutId = window.setTimeout(enableUI, 1200);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const handlePostCreated = () => {
    setShowCreatePost(false);
    window.dispatchEvent(new Event('postCreated'));
    if (currentPageName !== 'Feed') {
      navigate('/Feed');
    }
  };

  const showNav = !NO_NAV_PAGES.includes(currentPageName);
  const isFullWidth = FULL_WIDTH_PAGES.includes(currentPageName);
  const noBottomPad = NO_BOTTOM_PAD_PAGES.includes(currentPageName);

  if (isLoadingAuth || isLoadingPublicSettings) {
    return (
      <div className="min-h-[calc(var(--vh,1vh)*100)] bg-[var(--gh-bg)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--gh-accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <GlobalErrorBoundary>
        <AppErrorBoundary>
        <UserStoreProvider>
          <UIStoreProvider>
            <ContextMenuProvider>
            <div className="min-h-[calc(var(--vh,1vh)*100)] bg-background text-foreground relative overflow-x-clip">
            <div className="pointer-events-none absolute inset-0 opacity-70">
              <div className="absolute -top-24 left-[18%] h-[440px] w-[440px] rounded-full bg-green-500/11 blur-[120px]" />
              <div className="absolute top-[32%] -right-24 h-[340px] w-[340px] rounded-full bg-emerald-400/10 blur-[120px]" />
              <div className="absolute -bottom-24 left-[36%] h-[300px] w-[300px] rounded-full bg-blue-500/8 blur-[130px]" />
            </div>
            {showNav && (
              <DesktopNav user={user} currentPageName={currentPageName} />
            )}

            {showNav && (
              <MobileHeader 
                user={user} 
                currentPageName={currentPageName}
                onMenuClick={() => setShowMobileMenu(true)}
                hidden={navHidden}
              />
            )}
            
            <main
                        style={{ overscrollBehavior: 'none', WebkitOverflowScrolling: 'touch' }}
                        className={`
                        ${showNav ? 'lg:pl-[280px]' : ''} 
                        ${showNav ? 'pt-[52px] lg:pt-0' : ''} 
                        ${showNav && !noBottomPad ? 'pb-16 lg:pb-0' : ''}
                        ${isFullWidth ? '' : 'gh-page-shell'}
                        min-h-screen
                        transition-[padding] duration-300
                        pb-[env(safe-area-inset-bottom)]
                        relative z-10
                      `}>
              {children}
            </main>

            {showNav && (
              <MobileBottomNav user={user} currentPageName={currentPageName} hidden={navHidden} />
            )}

            <React.Suspense fallback={null}>
              {showMobileMenu && (
                <MobileMenu 
                  isOpen={showMobileMenu} 
                  onClose={() => setShowMobileMenu(false)} 
                  user={user}
                />
              )}

              {showCreatePost && user && (
                <CreatePost
                  isOpen={showCreatePost}
                  onClose={() => setShowCreatePost(false)}
                  onPostCreated={handlePostCreated}
                  currentUser={user}
                />
              )}

              {enableDeferredUI ? (
                <>
                  <CookieBanner />
                  <PWAInstallPrompt />
                  <UpdateNotification />
                  <PushNotificationManager currentUser={user} />
                  <OfflineQueue />
                  <NetworkIndicator />
                </>
              ) : null}
            </React.Suspense>
            <Toaster duration={2000} />
            </div>
            </ContextMenuProvider>
            </UIStoreProvider>
            </UserStoreProvider>
            </AppErrorBoundary>
            </GlobalErrorBoundary>
            </ToastProvider>
  );
}