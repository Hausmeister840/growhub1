import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function GoogleLoginFix() {
  const [currentUrl, setCurrentUrl] = useState('');
  const [callbackUrl, setCallbackUrl] = useState('');
  const [copied, setCopied] = useState({ url: false, callback: false });

  useEffect(() => {
    const url = window.location.origin;
    setCurrentUrl(url);
    setCallbackUrl(`${url}/auth/callback`);
  }, []);

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [type]: true });
    toast.success('In Zwischenablage kopiert!');
    setTimeout(() => setCopied({ ...copied, [type]: false }), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Google Login Fix</h1>
          <p className="text-xl text-zinc-400">
            "accounts.google.com hat die Verbindung abgelehnt"
          </p>
        </div>

        {/* Problem Erklärung */}
        <div className="glass-card rounded-3xl p-8 border border-red-500/30 mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
            <span className="text-3xl">🔴</span>
            Was ist das Problem?
          </h2>
          <p className="text-zinc-300 text-lg leading-relaxed mb-4">
            Deine App läuft auf <strong className="text-green-400">{currentUrl}</strong>
          </p>
          <p className="text-zinc-300 text-lg leading-relaxed mb-4">
            Aber in deiner <strong>Google Cloud Console</strong> stehen ALTE URLs gespeichert.
          </p>
          <p className="text-zinc-300 text-lg leading-relaxed">
            → Google blockt die Verbindung, weil die URL nicht übereinstimmt! 🚫
          </p>
        </div>

        {/* Lösung */}
        <div className="glass-card rounded-3xl p-8 border border-green-500/30 mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="text-3xl">✅</span>
            Die Lösung (5 Minuten)
          </h2>

          {/* Step 1 */}
          <div className="mb-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">Öffne Google Cloud Console</h3>
                <Button
                  onClick={() => window.open('https://console.cloud.google.com/apis/credentials', '_blank')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Zur Google Console
                </Button>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="mb-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">Klicke auf deinen OAuth Client</h3>
                <p className="text-zinc-400 mb-2">
                  Suche nach diesem Client:
                </p>
                <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
                  <code className="text-green-400 text-sm">
                    1068574045682-oji91u1tegp8gefhbfs0jkgep0rnk309.apps.googleusercontent.com
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="mb-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-4">LÖSCHE alle alten URLs</h3>
                <div className="bg-red-900/20 rounded-xl p-4 border border-red-500/30 mb-4">
                  <p className="text-red-400 font-semibold mb-3">❌ Diese URLs LÖSCHEN:</p>
                  <div className="space-y-2 text-sm font-mono">
                    <div className="text-zinc-400">❌ https://ee2e55cd...replit.dev</div>
                    <div className="text-zinc-400">❌ https://app.base44.com/auth/google/callback</div>
                    <div className="text-zinc-400">❌ https://growhub-copy-h568d3...</div>
                    <div className="text-zinc-400">❌ https://preview--grow-hub-copy...</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="mb-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-4">Trage diese URLs ein</h3>
                
                {/* JavaScript Origins */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-zinc-400 mb-2">
                    Autorisierte JavaScript-Quellen:
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                      <code className="text-green-400 break-all">{currentUrl}</code>
                    </div>
                    <Button
                      onClick={() => copyToClipboard(currentUrl, 'url')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {copied.url ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Redirect URIs */}
                <div>
                  <label className="block text-sm font-semibold text-zinc-400 mb-2">
                    Autorisierte Weiterleitungs-URIs:
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                      <code className="text-green-400 break-all">{callbackUrl}</code>
                    </div>
                    <Button
                      onClick={() => copyToClipboard(callbackUrl, 'callback')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {copied.callback ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="mb-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                5
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">Klicke auf SPEICHERN</h3>
                <p className="text-zinc-400">
                  ⏱️ Warte 2-3 Minuten, bis Google die Änderungen übernommen hat
                </p>
              </div>
            </div>
          </div>

          {/* Step 6 */}
          <div>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                6
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">Teste den Login</h3>
                <Button
                  onClick={() => window.location.href = '/'}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  Zurück zur App & Login testen
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Why this happens */}
        <div className="glass-card rounded-3xl p-8 border border-blue-500/30">
          <h2 className="text-2xl font-bold mb-4">💡 Warum passiert das?</h2>
          <div className="space-y-4 text-zinc-300">
            <p>
              <strong className="text-white">Sicherheitsfeature von Google:</strong> Google OAuth erlaubt nur Login-Anfragen von <strong>vorher registrierten URLs</strong>.
            </p>
            <p>
              <strong className="text-white">Dein Problem:</strong> Deine App läuft jetzt auf einer <strong>neuen URL</strong>, die Google noch nicht kennt.
            </p>
            <p>
              <strong className="text-white">Die Lösung:</strong> Du musst Google die neue URL bekanntgeben → dann funktioniert der Login wieder! ✅
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}