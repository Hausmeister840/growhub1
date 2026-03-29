import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function SystemCheck() {
  const [status, setStatus] = useState('checking');
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    setCurrentUrl(window.location.origin);
    runDiagnostics();
  }, []);

  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev, { message, type, time: new Date().toLocaleTimeString() }]);
  };

  const runDiagnostics = async () => {
    setStatus('checking');
    setLogs([]);
    
    addLog('🔍 Starte System-Check...', 'info');
    
    try {
      addLog('Test 1: Prüfe User-Status...', 'info');
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      addLog(`✅ User ist eingeloggt: ${currentUser.email}`, 'success');
      setStatus('success');
      return;
    } catch {
      addLog('⚠️ User ist nicht eingeloggt', 'warning');
    }

    addLog('Test 2: Prüfe URL-Konfiguration...', 'info');
    addLog(`Aktuelle URL: ${window.location.origin}`, 'info');
    
    if (window.self !== window.top) {
      addLog('⚠️ App läuft in einem iframe', 'warning');
    } else {
      addLog('✅ App läuft nicht in einem iframe', 'success');
    }

    if (window.location.protocol === 'https:') {
      addLog('✅ HTTPS ist aktiv', 'success');
    } else {
      addLog('❌ HTTP wird verwendet', 'error');
    }

    setStatus('needs_auth');
  };

  const copyLogs = () => {
    const logText = logs.map(l => `[${l.time}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(logText);
    toast.success('Logs kopiert!');
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
            status === 'success' ? 'bg-green-500' :
            status === 'error' ? 'bg-red-500' :
            status === 'checking' ? 'bg-blue-500' : 'bg-orange-500'
          }`}>
            {status === 'checking' && <Loader2 className="w-10 h-10 animate-spin text-white" />}
            {status === 'success' && <CheckCircle2 className="w-10 h-10 text-white" />}
            {(status === 'error' || status === 'needs_auth') && <AlertCircle className="w-10 h-10 text-white" />}
          </div>
          <h1 className="text-3xl font-bold mb-2">System Check</h1>
          <p className="text-zinc-400">
            {status === 'success' && 'Alles funktioniert! ✅'}
            {status === 'checking' && 'Überprüfe System-Status...'}
            {status === 'error' && 'Problem erkannt'}
            {status === 'needs_auth' && 'Authentifizierung erforderlich'}
          </p>
        </div>

        {user && (
          <div className="bg-zinc-900 rounded-2xl p-6 border border-green-500/30 mb-6">
            <h2 className="text-xl font-bold mb-4">👤 Eingeloggt als:</h2>
            <div className="flex items-center gap-4">
              {user.avatar_url && (
                <img src={user.avatar_url} alt="Avatar" className="w-16 h-16 rounded-full" />
              )}
              <div>
                <p className="font-bold text-lg">{user.full_name}</p>
                <p className="text-zinc-400">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">📋 Diagnose-Logs</h2>
            <Button onClick={copyLogs} variant="outline" size="sm" className="text-zinc-400">
              <Copy className="w-4 h-4 mr-2" />
              Kopieren
            </Button>
          </div>
          <div className="bg-black/50 rounded-xl p-4 max-h-96 overflow-y-auto font-mono text-sm space-y-2">
            {logs.map((log, i) => (
              <div key={i} className={`flex items-start gap-3 ${
                log.type === 'success' ? 'text-green-400' :
                log.type === 'error' ? 'text-red-400' :
                log.type === 'warning' ? 'text-orange-400' : 'text-zinc-400'
              }`}>
                <span className="text-zinc-600">[{log.time}]</span>
                <span>{log.message}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          {status === 'needs_auth' && (
            <Button
              onClick={() => base44.auth.redirectToLogin()}
              className="bg-green-500 hover:bg-green-600 text-black font-bold px-8 py-6 text-lg"
            >
              🔐 Jetzt anmelden
            </Button>
          )}
          <Button onClick={runDiagnostics} variant="outline" className="px-6">
            <RefreshCw className="w-4 h-4 mr-2" />
            Erneut prüfen
          </Button>
        </div>
      </div>
    </div>
  );
}