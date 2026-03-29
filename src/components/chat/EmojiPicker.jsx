import { useState } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

const EMOJI_CATEGORIES = {
  smileys: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓'],
  gestures: ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏'],
  hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  cannabis: ['🌿', '🍀', '🌱', '🌾', '🌳', '🌲', '🎋', '🪴', '💚', '🟢', '✨', '🔥', '💨', '🌈', '☮️'],
  nature: ['🌸', '🌺', '🌻', '🌷', '🌹', '🥀', '🌼', '🏵', '💐', '🍄', '🌰', '🦋', '🐝', '🐞', '🌙', '⭐', '✨', '🌟', '💫', '⚡', '🔥', '💧', '🌊', '☀️', '🌤', '⛅', '🌈'],
};

export default function EmojiPicker({ onSelect, onClose, position = 'top' }) {
  const [activeCategory, setActiveCategory] = useState('smileys');

  return (
    <>
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 10 : -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: position === 'top' ? 10 : -10 }}
        className={`
          absolute z-50 w-80 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl
          ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}
        `}
      >
        <div className="flex items-center justify-between p-3 border-b border-zinc-800">
          <h3 className="text-sm font-semibold text-white">Emoji auswählen</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="flex gap-1 px-3 py-2 border-b border-zinc-800">
          {Object.keys(EMOJI_CATEGORIES).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`
                px-3 py-1.5 text-xs rounded-lg font-medium transition-colors
                ${activeCategory === cat
                  ? 'bg-green-500 text-white'
                  : 'text-gray-400 hover:bg-zinc-800'
                }
              `}
            >
              {cat === 'smileys' && '😊'}
              {cat === 'gestures' && '👋'}
              {cat === 'hearts' && '❤️'}
              {cat === 'cannabis' && '🌿'}
              {cat === 'nature' && '🌸'}
            </button>
          ))}
        </div>

        <div className="p-3 max-h-64 overflow-y-auto">
          <div className="grid grid-cols-8 gap-1">
            {EMOJI_CATEGORIES[activeCategory].map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onSelect(emoji);
                  onClose();
                }}
                className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-zinc-800 rounded-lg transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  );
}