import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App.jsx';
import '@/index.css';
import '@/globals.css';
import { appParams } from '@/lib/app-params';

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);

const screenClassName = 'min-h-screen bg-background text-foreground flex items-center justify-center px-4';
const cardClassName = 'w-full max-w-2xl rounded-2xl border border-border bg-card p-6 md:p-8 shadow-2xl';

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Root render failed:', error, info);
  }

  render() {
    if (this.state.error) {
      return <BootErrorScreen error={this.state.error} />;
    }

    return this.props.children;
  }
}

function BootErrorScreen({ error }) {
  const message = error?.message || 'Unbekannter Startfehler';
  const stack = typeof error?.stack === 'string' ? error.stack : '';

  return (
    <div className={screenClassName}>
      <div className={`${cardClassName} space-y-5`}>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Startfehler</p>
          <h1 className="text-xl md:text-2xl font-semibold">Die App ist beim Laden abgesturzt</h1>
          <p className="text-zinc-300">
            Statt eines weißen Bildschirms siehst du jetzt den Boot-Fehler direkt im Browser.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-background/60 p-4 text-sm text-zinc-300 space-y-2">
          <p><span className="text-zinc-500">Fehler:</span> {message}</p>
          {stack ? (
            <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-zinc-400">{stack}</pre>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-md bg-amber-500 hover:bg-amber-400 px-3 py-2 text-sm font-medium text-black"
          >
            Neu laden
          </button>
        </div>
      </div>
    </div>
  );
}

function normalizeError(error) {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'string') {
    return new Error(error);
  }

  if (error?.reason instanceof Error) {
    return error.reason;
  }

  return new Error('Unbekannter Startfehler');
}

function renderBootError(error) {
  root.render(<BootErrorScreen error={normalizeError(error)} />);
}

function addConnectionHints(urlLike) {
  if (typeof document === 'undefined' || !urlLike) {
    return;
  }

  try {
    const { origin } = new URL(urlLike);
    const dnsPrefetch = document.createElement('link');
    dnsPrefetch.rel = 'dns-prefetch';
    dnsPrefetch.href = origin;
    document.head.appendChild(dnsPrefetch);

    const preconnect = document.createElement('link');
    preconnect.rel = 'preconnect';
    preconnect.href = origin;
    preconnect.crossOrigin = 'anonymous';
    document.head.appendChild(preconnect);
  } catch {
    // Ignore invalid URLs.
  }
}

async function registerProdServiceWorker() {
  if (import.meta.env.DEV || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch (error) {
    console.warn('Service Worker registration failed:', error);
  }
}

async function clearDevServiceWorkers() {
  if (!import.meta.env.DEV || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
    if ('caches' in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((key) => caches.delete(key)));
    }
  } catch (error) {
    console.warn('Service Worker cleanup skipped:', error);
  }
}

window.addEventListener('error', (event) => {
  renderBootError(event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  renderBootError(event.reason || event);
});

root.render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
);

clearDevServiceWorkers();
registerProdServiceWorker();
addConnectionHints(appParams.serverUrl);

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:beforeUpdate' }, '*');
  });
  import.meta.hot.on('vite:afterUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:afterUpdate' }, '*');
  });
}
