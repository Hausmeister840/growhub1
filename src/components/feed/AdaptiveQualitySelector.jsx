import { useState, useEffect } from 'react';
import { Settings, Zap, Wifi, WifiOff } from 'lucide-react';
import { enhancementLayer } from './ProgressiveEnhancementLayer';

export default function AdaptiveQualitySelector() {
  const [quality, setQuality] = useState('auto');
  const [networkSpeed, setNetworkSpeed] = useState('4g');

  useEffect(() => {
    const updateNetwork = () => {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      setNetworkSpeed(connection?.effectiveType || '4g');
      
      if (quality === 'auto') {
        const recommended = enhancementLayer.getQualityLevel();
        // Auto-adjust quality
      }
    };

    updateNetwork();
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    connection?.addEventListener('change', updateNetwork);

    return () => connection?.removeEventListener('change', updateNetwork);
  }, [quality]);

  const qualities = [
    { id: 'auto', label: 'Auto', icon: Zap },
    { id: 'ultra', label: '4K', icon: Settings },
    { id: 'high', label: 'HD', icon: Wifi },
    { id: 'low', label: 'SD', icon: WifiOff }
  ];

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
      <Settings className="w-3.5 h-3.5 text-zinc-400" />
      <select
        value={quality}
        onChange={(e) => setQuality(e.target.value)}
        className="bg-transparent text-xs text-zinc-400 focus:outline-none cursor-pointer"
      >
        {qualities.map(q => (
          <option key={q.id} value={q.id}>{q.label}</option>
        ))}
      </select>
      <div className={`w-2 h-2 rounded-full ${
        networkSpeed === '4g' ? 'bg-green-500' :
        networkSpeed === '3g' ? 'bg-yellow-500' :
        'bg-red-500'
      } animate-pulse`} />
    </div>
  );
}