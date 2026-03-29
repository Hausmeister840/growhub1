import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, errorCount: 0 };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState(prev => ({ 
      error, 
      errorInfo,
      errorCount: prev.errorCount + 1 
    }));
    
    console.error('GrowHub Error:', error, errorInfo);
    
    // Auto-reload after 3 errors
    if (this.state.errorCount >= 3) {
      setTimeout(() => {
        window.location.href = '/feed';
      }, 3000);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/feed';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full text-center border border-green-500/20">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Oops! Etwas ist schiefgelaufen 🌿
            </h2>
            <p className="text-gray-400 mb-6">
              Keine Sorge, das passiert den Besten. Versuche die Seite neu zu laden.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Neu laden
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                Startseite
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-gray-500 cursor-pointer text-sm">
                  Technische Details
                </summary>
                <pre className="mt-2 p-3 bg-black/50 rounded text-xs text-red-400 overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;