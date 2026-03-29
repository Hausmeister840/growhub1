import React from 'react'
import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig, preloadLayout, preloadMainPages, preloadAllPagesInBackground, preloadPage } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { appParams, hasBase44Config } from '@/lib/app-params';
import MissingConfigScreen from '@/components/setup/MissingConfigScreen';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : null;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const RouteLoadingScreen = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background text-foreground" role="status" aria-live="polite" aria-busy="true">
    <div className="gh-status-card">
      <div className="gh-loader-ring" />
      <p className="text-sm text-zinc-300">Seite wird geladen ...</p>
    </div>
  </div>
);

const RouteElement = ({ currentPageName, Page }) => (
  <React.Suspense fallback={<RouteLoadingScreen />}>
    <LayoutWrapper currentPageName={currentPageName}>
      {Page ? <Page /> : null}
    </LayoutWrapper>
  </React.Suspense>
);

const AuthRedirectScreen = ({ navigateToLogin, loginUrl }) => {
  const [redirectAttempted, setRedirectAttempted] = React.useState(false);
  const isLocalLoop = typeof window !== 'undefined'
    && window.location.origin.includes('localhost')
    && window.location.pathname.startsWith('/login');

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setRedirectAttempted(true);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background text-foreground" role="status" aria-live="polite" aria-busy="true">
      <div className="gh-status-card max-w-md px-6 text-center space-y-4">
        <div className="gh-loader-ring mx-auto" />
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight">Anmelden oder Konto erstellen</h1>
          <p className="text-sm text-zinc-300">
            Gleicher Flow wie Social Apps: Ein Klick und du landest im sicheren Online-Login.
          </p>
        </div>
        {isLocalLoop ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-left text-sm text-amber-200">
            Lokale Login-Schleife erkannt. Das passiert, wenn der Browser noch eine alte `server_url` auf `localhost` gespeichert hat.
          </div>
        ) : null}
        <div className="flex flex-col gap-2">
          <button
            onClick={navigateToLogin}
            className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Jetzt online anmelden
          </button>
          <button
            onClick={clearStoredBase44Config}
            className="inline-flex items-center justify-center rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            Lokale Base44-Config löschen
          </button>
        </div>
        {loginUrl ? (
          <p className="break-all text-xs text-zinc-500">
            Ziel: {loginUrl}
          </p>
        ) : null}
        {redirectAttempted ? (
          <p className="text-xs text-zinc-600">
            Falls dein Browser Weiterleitungen blockt, nutze den Button oben.
          </p>
        ) : null}
      </div>
    </div>
  );
};

const clearStoredBase44Config = () => {
  const storageKeys = [
    'base44_app_id',
    'base44_server_url',
    'base44_access_token',
    'base44_from_url',
    'base44_functions_version',
  ];

  try {
    storageKeys.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Ignore localStorage failures in private mode.
  }

  window.location.reload();
};

const BackendErrorScreen = ({ error }) => (
  <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
    <div className="w-full max-w-2xl gh-content-section p-6 md:p-8 space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Verbindung fehlgeschlagen</p>
        <h1 className="text-xl md:text-2xl font-semibold">Die App kann das Base44-Backend nicht erreichen</h1>
        <p className="text-zinc-300">
          Das ist oft ein lokaler Konfigurationsrest im Browser oder eine ungültige `server_url`.
          Statt eines weißen Bildschirms siehst du jetzt die Ursache.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-background/60 p-4 text-sm text-zinc-300 space-y-2">
        <p><span className="text-zinc-500">App-ID:</span> {appParams.appId || 'nicht gesetzt'}</p>
        <p><span className="text-zinc-500">Backend-URL:</span> {appParams.serverUrl || 'nicht gesetzt'}</p>
        <p><span className="text-zinc-500">Fehlertyp:</span> {error?.type || 'unknown'}</p>
        <p><span className="text-zinc-500">Details:</span> {error?.message || 'Keine weiteren Details'}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={clearStoredBase44Config}
          className="inline-flex items-center gap-2 rounded-md bg-amber-500 hover:bg-amber-400 px-3 py-2 text-sm font-semibold text-black"
        >
          Gespeicherte Config löschen
        </button>
        <button
          onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-md border border-border hover:bg-accent px-3 py-2 text-sm font-medium"
        >
          Neu laden
        </button>
      </div>
    </div>
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, loginUrl } = useAuth();
  const missingConfig = !hasBase44Config();

  if (missingConfig) {
    return <MissingConfigScreen />;
  }

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/90">
        <div className="gh-status-card" role="status" aria-live="polite" aria-busy="true">
          <div className="gh-loader-ring" />
          <p className="text-sm text-zinc-300">Verbindung wird aufgebaut ...</p>
        </div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      return <AuthRedirectScreen navigateToLogin={navigateToLogin} loginUrl={loginUrl} />;
    }

    return <BackendErrorScreen error={authError} />;
  }

  return (
    <Routes>
      <Route path="/" element={<RouteElement currentPageName={mainPageKey} Page={MainPage} />} />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={<RouteElement currentPageName={path} Page={Page} />}
        />
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  React.useEffect(() => {
    preloadLayout();
    preloadPage(mainPageKey);

    const primaryPages = ['Feed', 'Messages', 'Profile', 'Notifications'];
    const warmup = () => {
      preloadMainPages(primaryPages);
      preloadAllPagesInBackground(primaryPages).catch((error) => {
        console.warn('Background page preload failed:', error);
      });
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const id = window.requestIdleCallback(warmup, { timeout: 800 });
      return () => window.cancelIdleCallback(id);
    }

    const timeoutId = window.setTimeout(warmup, 450);
    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!hasBase44Config()) {
    return <MissingConfigScreen />;
  }

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
