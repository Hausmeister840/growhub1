import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * 🛡️ ERROR BOUNDARY - IMPROVED
 * Fängt alle React-Fehler und bietet bessere Recovery-Optionen
 */

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("💥 Error caught by boundary:", error, errorInfo);
    
    this.setState(prev => ({
      errorInfo,
      errorCount: prev.errorCount + 1
    }));

    // ✅ FIX: Error Logging
    if (typeof window !== 'undefined') {
      // Log to console with full context
      console.group('🔴 React Error Boundary');
      console.error('Error:', error);
      console.error('Component Stack:', errorInfo.componentStack);
      console.error('Error Count:', this.state.errorCount + 1);
      console.groupEnd();

      // Optional: Send to error tracking service
      if (window.gtag) {
        window.gtag('event', 'exception', {
          description: error.message,
          fatal: true
        });
      }
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
    
    // ✅ FIX: Call onReset prop if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || 
         window.location.hostname.includes('preview'));

      return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 to-black p-6 flex items-center justify-center">
          <Card className="max-w-2xl mx-auto border-red-500/30 bg-zinc-900/95 backdrop-blur-xl">
            <CardHeader>
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-10 h-10 text-red-400" />
              </div>
              <CardTitle className="text-center text-red-400 text-2xl font-bold">
                Hoppla, da ist etwas schiefgelaufen
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-zinc-400 mb-6">
                Ein unerwarteter Fehler ist aufgetreten. Bitte versuche eine der folgenden Optionen:
              </p>

              <div className="flex flex-col gap-3 mb-6">
                <Button
                  onClick={this.handleReset}
                  className="bg-green-500 hover:bg-green-600 w-full text-white font-bold"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Komponente neu laden
                </Button>

                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="w-full border-zinc-700 hover:bg-zinc-800"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Seite neu laden
                </Button>

                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="w-full border-zinc-700 hover:bg-zinc-800"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Zur Startseite
                </Button>
              </div>

              {/* ✅ FIX: Bessere Error Details für Development */}
              {isDevelopment && this.state.error && (
                <details className="text-left">
                  <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-400 mb-2 flex items-center gap-2">
                    <Bug className="w-4 h-4" />
                    🔧 Fehlerdetails (nur in Development)
                  </summary>
                  <div className="bg-zinc-950 rounded-lg p-4 space-y-3 max-h-96 overflow-y-auto">
                    <div>
                      <p className="text-xs font-mono text-red-400 mb-1">Error Message:</p>
                      <pre className="text-xs bg-black p-2 rounded text-red-300 whitespace-pre-wrap overflow-x-auto">
                        {this.state.error.toString()}
                      </pre>
                    </div>
                    
                    {this.state.error.stack && (
                      <div>
                        <p className="text-xs font-mono text-red-400 mb-1">Stack Trace:</p>
                        <pre className="text-xs bg-black p-2 rounded text-zinc-400 whitespace-pre-wrap overflow-x-auto">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    
                    {this.state.errorInfo && (
                      <div>
                        <p className="text-xs font-mono text-red-400 mb-1">Component Stack:</p>
                        <pre className="text-xs bg-black p-2 rounded text-zinc-400 whitespace-pre-wrap overflow-x-auto">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-zinc-600 pt-2 border-t border-zinc-800">
                      <span>Fehler #{this.state.errorCount}</span>
                      <span>{new Date().toLocaleString('de-DE')}</span>
                    </div>
                  </div>
                </details>
              )}

              <p className="text-xs text-zinc-600 mt-6">
                Problem besteht weiter? Kontaktiere den Support oder melde einen Bug.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}