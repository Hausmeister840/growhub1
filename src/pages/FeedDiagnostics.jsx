import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { diagnostics as runDiagnostics } from '@/functions/feed/diagnostics';

export default function FeedDiagnostics() {
  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const loadDiagnostics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Starting diagnostics...');
      
      const response = await runDiagnostics();
      
      console.log('✅ Diagnostics response:', response);
      
      if (response?.data?.success && response.data.diagnostics) {
        setDiagnostics(response.data.diagnostics);
      } else if (response?.data?.diagnostics) {
        setDiagnostics(response.data.diagnostics);
      } else {
        throw new Error('Keine Diagnostik-Daten erhalten');
      }
      
    } catch (err) {
      console.error('❌ Diagnostics error:', err);
      setError(err?.message || 'Fehler beim Ausführen der Diagnose');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-zinc-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pass':
        return 'border-green-500/30 bg-green-500/10';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'error':
      case 'critical':
        return 'border-red-500/30 bg-red-500/10';
      default:
        return 'border-zinc-500/30 bg-zinc-500/10';
    }
  };

  if (loading && !diagnostics) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Führe Diagnose aus...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-red-500/10 border-red-500/30">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center gap-2">
                <AlertCircle className="w-6 h-6" />
                Fehler bei der Diagnose
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-300 mb-4">{error}</p>
              <Button onClick={loadDiagnostics} className="bg-green-500 hover:bg-green-600">
                <RefreshCw className="w-4 h-4 mr-2" />
                Erneut versuchen
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!diagnostics) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-zinc-400 mb-4">Keine Diagnosedaten verfügbar</p>
          <Button onClick={loadDiagnostics} className="bg-green-500 hover:bg-green-600">
            <RefreshCw className="w-4 h-4 mr-2" />
            Diagnose starten
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">🔍 Feed Diagnostics</h1>
            <p className="text-zinc-400">
              {diagnostics?.timestamp ? new Date(diagnostics.timestamp).toLocaleString('de-DE') : ''}
            </p>
          </div>
          <Button 
            onClick={loadDiagnostics} 
            disabled={loading}
            className="bg-green-500 hover:bg-green-600"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Lädt...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Aktualisieren
              </>
            )}
          </Button>
        </div>

        {/* Summary */}
        {diagnostics?.summary && (
          <Card className="mb-6 bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Zusammenfassung</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">
                    {diagnostics.summary.total_checks || 0}
                  </div>
                  <div className="text-sm text-zinc-400">Tests</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500 mb-1">
                    {diagnostics.summary.passed || 0}
                  </div>
                  <div className="text-sm text-zinc-400">Bestanden</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-500 mb-1">
                    {diagnostics.summary.warnings || 0}
                  </div>
                  <div className="text-sm text-zinc-400">Warnungen</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-500 mb-1">
                    {diagnostics.summary.errors || 0}
                  </div>
                  <div className="text-sm text-zinc-400">Fehler</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 mb-1">
                    {diagnostics.summary.critical || 0}
                  </div>
                  <div className="text-sm text-zinc-400">Kritisch</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Results */}
        {diagnostics?.checks && Array.isArray(diagnostics.checks) && diagnostics.checks.length > 0 ? (
          <div className="space-y-4">
            {diagnostics.checks.map((check, index) => (
              <Card 
                key={index} 
                className={`bg-zinc-900 border ${getStatusColor(check.status)}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {getStatusIcon(check.status)}
                      {check.name || `Test ${index + 1}`}
                    </CardTitle>
                  </div>
                </CardHeader>
                {check.details && (
                  <CardContent>
                    <pre className="bg-black/50 p-3 rounded-lg text-xs overflow-auto max-h-64">
                      {JSON.stringify(check.details, null, 2)}
                    </pre>
                  </CardContent>
                )}
                {check.error && (
                  <CardContent>
                    <p className="text-red-400 text-sm">{check.error}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="text-center py-8">
              <p className="text-zinc-400">Keine Test-Ergebnisse verfügbar</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}