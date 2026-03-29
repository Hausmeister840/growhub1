import { X } from 'lucide-react';
import { motion } from 'framer-motion';

const STICKER_PACKS = {
  cannabis: [
    '🌿', '🍀', '💚', '🔥', '💨', '✨', 
    '🌱', '🌾', '🌳', '🪴', '🟢', '☮️'
  ],
  vibes: [
    '😎', '🤘', '🎶', '🎵', '🎸', '🎨',
    '🌈', '🔮', '💫', '⭐', '🌟', '✨'
  ]
};

export default function StickerPicker({ onSelect, onClose }) {
  return (
    <>
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="absolute bottom-full left-0 mb-2 w-72 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl z-50"
      >
        <div className="flex items-center justify-between p-3 border-b border-zinc-800">
          <h3 className="text-sm font-semibold text-white">Sticker</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="p-3 max-h-64 overflow-y-auto space-y-4">
          {Object.entries(STICKER_PACKS).map(([packName, stickers]) => (
            <div key={packName}>
              <p className="text-xs text-gray-400 mb-2 uppercase font-semibold">
                {packName}
              </p>
              <div className="grid grid-cols-6 gap-2">
                {stickers.map((sticker, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onSelect(sticker);
                      onClose();
                    }}
                    className="w-12 h-12 flex items-center justify-center text-3xl hover:bg-zinc-800 rounded-xl transition-all hover:scale-110"
                  >
                    {sticker}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </>
  );
}