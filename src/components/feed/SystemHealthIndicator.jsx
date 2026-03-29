import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

export default function SystemHealthIndicator() {
  const [health, setHealth] = useState({
    api: 'healthy',
    cache: 'healthy',
    edge: 'healthy',
    overall: 100
  });

  useEffect(() => {
    const checkHealth = () => {
      // Simulate system health check
      const apiLatency = Math.random() * 200;
      const cacheHitRate = 0.85 + Math.random() * 0.15;
      
      setHealth({
        api: apiLatency < 100 ? 'healthy' : apiLatency < 200 ? 'degraded' : 'down',
        cache: cacheHitRate > 0.9 ? 'healthy' : 'degraded',
        edge: 'healthy',
        overall: Math.round(cacheHitRate * 100)
      });
    };

    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl">
      <Activity className={`w-3.5 h-3.5 ${
        health.overall > 95 ? 'text-green-400' : 
        health.overall > 80 ? 'text-yellow-400' : 
        'text-red-400'
      }`} />
      
      <div className="flex items-center gap-1">
        <div className={`w-1.5 h-1.5 rounded-full ${
          health.api === 'healthy' ? 'bg-green-500' : 
          health.api === 'degraded' ? 'bg-yellow-500' : 
          'bg-red-500'
        } animate-pulse`} />
        <div className={`w-1.5 h-1.5 rounded-full ${
          health.cache === 'healthy' ? 'bg-green-500' : 'bg-yellow-500'
        } animate-pulse`} />
        <div className={`w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse`} />
      </div>

      <span className="text-xs text-zinc-500 ml-1">
        {health.overall}%
      </span>
    </div>
  );
}