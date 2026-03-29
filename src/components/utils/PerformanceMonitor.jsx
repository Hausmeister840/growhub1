import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, Wifi, Battery, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/**
 * 📊 PERFORMANCE MONITOR
 * Echtzeit-Performance-Tracking für Development & Debug
 */

export default function PerformanceMonitor() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [metrics, setMetrics] = useState({
    fps: 60,
    memory: 0,
    network: 'unknown',
    battery: 100,
    loadTime: 0,
    apiCalls: 0,
    errors: 0
  });

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const apiCallsRef = useRef(0);
  const errorsRef = useRef(0);

  // ✅ FPS Monitoring
  useEffect(() => {
    let animationFrameId;

    const measureFPS = () => {
      frameCountRef.current++;
      const currentTime = performance.now();
      const elapsed = currentTime - lastTimeRef.current;

      if (elapsed >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / elapsed);
        setMetrics(prev => ({ ...prev, fps }));
        frameCountRef.current = 0;
        lastTimeRef.current = currentTime;
      }

      animationFrameId = requestAnimationFrame(measureFPS);
    };

    measureFPS();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // ✅ Memory Monitoring
  useEffect(() => {
    if (!performance.memory) return;

    const interval = setInterval(() => {
      const memory = Math.round(performance.memory.usedJSHeapSize / 1048576); // MB
      setMetrics(prev => ({ ...prev, memory }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // ✅ Network Monitoring
  useEffect(() => {
    if (!navigator.connection) return;

    const updateNetwork = () => {
      const connection = navigator.connection;
      const effectiveType = connection.effectiveType || 'unknown';
      setMetrics(prev => ({ ...prev, network: effectiveType }));
    };

    updateNetwork();
    navigator.connection.addEventListener('change', updateNetwork);

    return () => {
      navigator.connection.removeEventListener('change', updateNetwork);
    };
  }, []);

  // ✅ Battery Monitoring
  useEffect(() => {
    if (!navigator.getBattery) return;

    navigator.getBattery().then(battery => {
      const updateBattery = () => {
        setMetrics(prev => ({ 
          ...prev, 
          battery: Math.round(battery.level * 100) 
        }));
      };

      updateBattery();
      battery.addEventListener('levelchange', updateBattery);

      return () => {
        battery.removeEventListener('levelchange', updateBattery);
      };
    });
  }, []);

  // ✅ Load Time
  useEffect(() => {
    if (performance.timing) {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      setMetrics(prev => ({ ...prev, loadTime: Math.round(loadTime) }));
    }
  }, []);

  // ✅ Track API Calls (global listener)
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      apiCallsRef.current++;
      setMetrics(prev => ({ ...prev, apiCalls: apiCallsRef.current }));
      return originalFetch(...args);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // ✅ Track Errors
  useEffect(() => {
    const handleError = () => {
      errorsRef.current++;
      setMetrics(prev => ({ ...prev, errors: errorsRef.current }));
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  // ✅ Nur in Development anzeigen
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
    return null;
  }

  const getPerformanceColor = (fps) => {
    if (fps >= 55) return 'text-green-400';
    if (fps >= 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getNetworkColor = (network) => {
    if (network === '4g') return 'text-green-400';
    if (network === '3g') return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 z-[999] w-12 h-12 bg-zinc-900 border border-zinc-700 rounded-full flex items-center justify-center shadow-lg hover:bg-zinc-800 transition-colors"
        >
          <Activity className="w-5 h-5 text-green-400" />
        </motion.button>
      )}

      {/* Performance Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-4 z-[999] w-80"
          >
            <Card className="bg-zinc-900/95 backdrop-blur-xl border-zinc-800 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-400" />
                  <h3 className="text-sm font-bold text-white">Performance Monitor</h3>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="h-6 w-6"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="h-6 w-6"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Metrics */}
              {!isMinimized && (
                <div className="p-3 space-y-2">
                  {/* FPS */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-zinc-400" />
                      <span className="text-zinc-400">FPS</span>
                    </div>
                    <span className={`font-bold ${getPerformanceColor(metrics.fps)}`}>
                      {metrics.fps}
                    </span>
                  </div>

                  {/* Memory */}
                  {metrics.memory > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-zinc-400" />
                        <span className="text-zinc-400">Memory</span>
                      </div>
                      <span className="font-bold text-white">{metrics.memory} MB</span>
                    </div>
                  )}

                  {/* Network */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-zinc-400" />
                      <span className="text-zinc-400">Network</span>
                    </div>
                    <span className={`font-bold uppercase ${getNetworkColor(metrics.network)}`}>
                      {metrics.network}
                    </span>
                  </div>

                  {/* Battery */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Battery className="w-4 h-4 text-zinc-400" />
                      <span className="text-zinc-400">Battery</span>
                    </div>
                    <span className="font-bold text-white">{metrics.battery}%</span>
                  </div>

                  {/* Load Time */}
                  {metrics.loadTime > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Load Time</span>
                      <span className="font-bold text-white">{metrics.loadTime}ms</span>
                    </div>
                  )}

                  {/* API Calls */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">API Calls</span>
                    <span className="font-bold text-white">{metrics.apiCalls}</span>
                  </div>

                  {/* Errors */}
                  {metrics.errors > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Errors</span>
                      <span className="font-bold text-red-400">{metrics.errors}</span>
                    </div>
                  )}

                  {/* Performance Score */}
                  <div className="pt-2 border-t border-zinc-800">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Score</span>
                      <span className={`text-lg font-bold ${getPerformanceColor(metrics.fps)}`}>
                        {metrics.fps >= 55 ? '🚀 Excellent' : metrics.fps >= 30 ? '⚡ Good' : '🐌 Poor'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}