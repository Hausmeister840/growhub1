import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wind, Thermometer, Music } from 'lucide-react';

export default function MultiSensoryContent({ post }) {
  const [activeEffects, setActiveEffects] = useState([]);

  useEffect(() => {
    if (!post.sensory_metadata) return;

    const effects = [];
    
    if (post.sensory_metadata.ambient_sound) {
      effects.push({ type: 'sound', value: post.sensory_metadata.ambient_sound });
    }
    if (post.sensory_metadata.temperature) {
      effects.push({ type: 'temp', value: post.sensory_metadata.temperature });
    }
    if (post.sensory_metadata.haptic_pattern) {
      effects.push({ type: 'haptic', value: post.sensory_metadata.haptic_pattern });
    }

    setActiveEffects(effects);

    // Trigger haptic if supported
    if (post.sensory_metadata.haptic_pattern && 'vibrate' in navigator) {
      navigator.vibrate(post.sensory_metadata.haptic_pattern);
    }
  }, [post]);

  if (activeEffects.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl"
    >
      <Wind className="w-4 h-4 text-indigo-400" />
      <div className="flex items-center gap-3">
        {activeEffects.map((effect, idx) => (
          <div key={idx} className="flex items-center gap-1">
            {effect.type === 'sound' && <Music className="w-3 h-3 text-indigo-300" />}
            {effect.type === 'temp' && <Thermometer className="w-3 h-3 text-orange-300" />}
            {effect.type === 'haptic' && <Wind className="w-3 h-3 text-purple-300" />}
            <span className="text-xs text-indigo-300">{effect.type}</span>
          </div>
        ))}
      </div>
      <span className="text-xs text-indigo-400 font-medium ml-auto">
        Multi-Sensory
      </span>
    </motion.div>
  );
}