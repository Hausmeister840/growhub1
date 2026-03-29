import { Card } from '@/components/ui/card';
import { FileCode, CheckCircle } from 'lucide-react';

/**
 * 📱 PWA SETUP INSTRUCTIONS
 * Anleitung für manuelle PWA-Dateien
 */

export default function PWAInstructions() {
  return (
    <Card className="p-6 bg-zinc-900 border-zinc-800">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <FileCode className="w-6 h-6 text-green-500" />
        PWA Setup Anleitung
      </h2>

      <div className="space-y-6">
        {/* Service Worker */}
        <div>
          <h3 className="font-semibold mb-2 text-green-400">1. Service Worker (sw.js)</h3>
          <p className="text-sm text-zinc-400 mb-3">
            Erstelle eine Datei <code className="bg-zinc-800 px-2 py-1 rounded">sw.js</code> im Root-Verzeichnis:
          </p>
          <pre className="bg-zinc-950 p-4 rounded-lg overflow-x-auto text-xs text-zinc-300">
{`const CACHE = 'growhub-v1';
const STATIC = ['/', '/index.html'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});`}
          </pre>
        </div>

        {/* Manifest */}
        <div>
          <h3 className="font-semibold mb-2 text-green-400">2. Manifest (manifest.json)</h3>
          <p className="text-sm text-zinc-400 mb-3">
            Erstelle eine Datei <code className="bg-zinc-800 px-2 py-1 rounded">manifest.json</code> im Root-Verzeichnis:
          </p>
          <pre className="bg-zinc-950 p-4 rounded-lg overflow-x-auto text-xs text-zinc-300">
{`{
  "name": "GrowHub",
  "short_name": "GrowHub",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#10B981",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}`}
          </pre>
        </div>

        {/* HTML Head */}
        <div>
          <h3 className="font-semibold mb-2 text-green-400">3. HTML Head Tags</h3>
          <p className="text-sm text-zinc-400 mb-3">
            Füge diese Tags in <code className="bg-zinc-800 px-2 py-1 rounded">index.html</code> ein:
          </p>
          <pre className="bg-zinc-950 p-4 rounded-lg overflow-x-auto text-xs text-zinc-300">
{`<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#10B981">
<meta name="apple-mobile-web-app-capable" content="yes">
<link rel="apple-touch-icon" href="/icon-192.png">`}
          </pre>
        </div>

        <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-green-400 mb-1">Hinweis</p>
            <p className="text-zinc-300">
              Die PWA-Komponenten sind bereits implementiert. Nach dem Upload der Dateien 
              funktionieren Offline-Modus und Push-Notifications automatisch.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}