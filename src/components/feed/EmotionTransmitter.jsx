import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Smile, Zap, Cloud, Sun, Moon } from 'lucide-react';

const emotions = [
  { id: 'happy', icon: Smile, label: 'Glücklich', color: 'from-yellow-400 to-orange-500' },
  { id: 'love', icon: Heart, label: 'Verliebt', color: 'from-red-400 to-pink-500' },
  { id: 'energetic', icon: Zap, label: 'Energiegeladen', color: 'from-orange-400 to-red-500' },
  { id: 'calm', icon: Cloud, label: 'Entspannt', color: 'from-blue-400 to-purple-500' },
  { id: 'creative', icon: Sun, label: 'Kreativ', color: 'from-purple-400 to-pink-500' },
  { id: 'chill', icon: Moon, label: 'Chill', color: 'from-indigo-400 to-blue-500' }
];

export default function EmotionTransmitter({ post }) {
  const [selectedEmotion, setSelectedEmotion] = useState(post.emotion || null);
  const [showEmotions, setShowEmotions] = useState(false);

  const transmitEmotion = (emotion) => {
    setSelectedEmotion(emotion);
    setShowEmotions(false);
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 20, 10]);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowEmotions(!showEmotions)}
        className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
      >
        {selectedEmotion ? (
          <>
            {React.createElement(emotions.find(e => e.id === selectedEmotion.id)?.icon || Heart, {
              className: `w-4 h-4 bg-gradient-to-r ${selectedEmotion.color} bg-clip-text text-transparent`
            })}
            <span className="text-xs text-white">{selectedEmotion.label}</span>
          </>
        ) : (
          <>
            <Heart className="w-4 h-4 text-zinc-400" />
            <span className="text-xs text-zinc-400">Stimmung teilen</span>
          </>
        )}
      </button>

      {showEmotions && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-full mt-2 left-0 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl z-20"
        >
          <div className="grid grid-cols-3 gap-2">
            {emotions.map((emotion) => {
              const Icon = emotion.icon;
              return (
                <motion.button
                  key={emotion.id}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => transmitEmotion(emotion)}
                  className="flex flex-col items-center gap-1 p-3 hover:bg-white/10 rounded-xl transition-all"
                >
                  <div className={`p-2 bg-gradient-to-br ${emotion.color} rounded-xl`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[10px] text-zinc-400">{emotion.label}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}