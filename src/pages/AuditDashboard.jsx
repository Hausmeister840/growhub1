import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, CheckCircle, AlertTriangle, XCircle, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function AuditDashboard() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const runAudit = async () => {
    setLoading(true);
    setResults(null);
    
    try {
      const response = await fetch('/api/functions/audit/completeAppAudit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResults(data.audit);
        toast.success('Audit abgeschlossen!');
      } else {
        toast.error(data.error || 'Audit fehlgeschlagen');
      }
    } catch (error) {
      console.error('Audit error:', error);
      toast.error('Audit konnte nicht ausgeführt werden');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!results) return;
    
    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-report-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">App Audit Dashboard</h1>
            <p className="text-zinc-400 mt-2">Vollständige Überprüfung der App-Integrität</p>
          </div>
          
          <div className="flex gap-3">
            {results && (
              <Button 
                onClick={downloadReport}
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                Report herunterladen
              </Button>
            )}
            
            <Button 
              onClick={runAudit}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Läuft...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Audit starten
                </>
              )}
            </Button>
          </div>
        </div>

        {loading && (
          <Card className="bg-zinc-900 border-zinc-800 p-8 text-center">
            <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-green-500" />
            <p className="text-lg">Audit läuft... Dies kann einige Minuten dauern.</p>
            <p className="text-sm text-zinc-400 mt-2">
              Bitte schließe diese Seite nicht.
            </p>
          </Card>
        )}

        {results && (
          <>
            {/* Summary Card */}
            <Card className="bg-zinc-900 border-zinc-800 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">
                  Gesamtstatus: {results.overall_status.toUpperCase()}
                </h2>
                <div className="text-4xl font-bold text-green-500">
                  {results.score}/{results.max_score}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <XCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
                  <div className="text-2xl font-bold">{results.critical_issues.length}</div>
                  <div className="text-sm text-zinc-400">Kritische Probleme</div>
                </div>
                
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                  <div className="text-2xl font-bold">{results.warnings.length}</div>
                  <div className="text-sm text-zinc-400">Warnungen</div>
                </div>
                
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <div className="text-2xl font-bold">{results.recommendations.length}</div>
                  <div className="text-sm text-zinc-400">Empfehlungen</div>
                </div>
              </div>
            </Card>

            {/* Critical Issues */}
            {results.critical_issues.length > 0 && (
              <Card className="bg-red-500/10 border-red-500/30 p-6 mb-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <XCircle className="w-6 h-6" />
                  Kritische Probleme
                </h3>
                <div className="space-y-3">
                  {results.critical_issues.map((issue, index) => (
                    <div key={index} className="bg-black/30 rounded p-3">
                      <div className="font-bold text-red-400">{issue.category}</div>
                      <div className="text-sm mt-1">{issue.message}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Warnings */}
            {results.warnings.length > 0 && (
              <Card className="bg-yellow-500/10 border-yellow-500/30 p-6 mb-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6" />
                  Warnungen
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {results.warnings.map((warning, index) => (
                    <div key={index} className="bg-black/30 rounded p-3 text-sm">
                      <span className="font-bold text-yellow-400">{warning.category}:</span> {warning.message}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Statistics */}
            {results.statistics && (
              <Card className="bg-zinc-900 border-zinc-800 p-6 mb-6">
                <h3 className="text-xl font-bold mb-4">Statistiken</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(results.statistics).map(([key, value]) => (
                    <div key={key} className="bg-zinc-800 rounded p-3">
                      <div className="text-2xl font-bold text-green-500">{value}</div>
                      <div className="text-sm text-zinc-400">{key.replace(/_/g, ' ')}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Detailed Reports */}
            {results.detailed_reports && (
              <Card className="bg-zinc-900 border-zinc-800 p-6">
                <h3 className="text-xl font-bold mb-4">Detaillierte Berichte</h3>
                <div className="space-y-4">
                  {Object.entries(results.detailed_reports).map(([category, report]) => (
                    <div key={category} className="bg-zinc-800 rounded p-4">
                      <h4 className="font-bold mb-2 capitalize">{category.replace(/_/g, ' ')}</h4>
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(report, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}