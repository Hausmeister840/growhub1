import { Sparkles } from 'lucide-react';

export default function FeedHeader({ activeTab, onTabChange, onMenuClick, currentUser }) {
  const tabs = [
    { key: 'for_you', label: 'Für dich', emoji: '✨', gradient: 'from-purple-500 to-pink-500' },
    { key: 'latest', label: 'Neueste', emoji: '⚡', gradient: 'from-blue-500 to-cyan-500' },
    { key: 'trending', label: 'Trending', emoji: '🔥', gradient: 'from-orange-500 to-red-500' },
    { key: 'videos', label: 'Videos', emoji: '📹', gradient: 'from-green-500 to-emerald-500' }
  ];

  return (
    <div className="sticky top-14 lg:top-0 z-30 bg-black/95 backdrop-blur-xl border-b border-zinc-800">
      <div className="max-w-[600px] mx-auto px-4 lg:px-6 py-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => {
            const isActive = activeTab === tab.key;
            
            return (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`
                  relative flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300
                  ${isActive
                    ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg transform scale-105`
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                  }
                `}
              >
                <span className="text-base">{tab.emoji}</span>
                <span>{tab.label}</span>
                
                {isActive && tab.key === 'for_you' && (
                  <Sparkles className="w-3 h-3 text-white/70 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}