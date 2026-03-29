import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, ChevronRight } from 'lucide-react';

export default function ChooseYourAdventure({ post }) {
  const [currentPath, setCurrentPath] = useState([0]);
  const [choices, setChoices] = useState(post.adventure_data?.choices || []);

  if (!post.adventure_data) return null;

  const currentChoice = getCurrentNode(post.adventure_data, currentPath);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-3 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-4 space-y-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <GitBranch className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-semibold text-white">Interaktive Story</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentPath.join('-')}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4"
        >
          <p className="text-white leading-relaxed">{currentChoice.text}</p>

          {currentChoice.options && (
            <div className="space-y-2">
              {currentChoice.options.map((option, idx) => (
                <motion.button
                  key={idx}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCurrentPath([...currentPath, idx])}
                  className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left text-sm text-zinc-300 hover:text-white transition-all flex items-center justify-between group"
                >
                  <span>{option.label}</span>
                  <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
                </motion.button>
              ))}
            </div>
          )}

          {!currentChoice.options && (
            <div className="text-center py-4">
              <p className="text-green-400 font-semibold mb-3">Ende erreicht! 🎉</p>
              <button
                onClick={() => setCurrentPath([0])}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium"
              >
                Neu starten
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-center gap-1 pt-2">
        {currentPath.map((_, idx) => (
          <div
            key={idx}
            className={`w-1.5 h-1.5 rounded-full ${
              idx === currentPath.length - 1 ? 'bg-blue-400' : 'bg-white/20'
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}

function getCurrentNode(data, path) {
  let current = data;
  path.forEach((index, depth) => {
    if (depth === 0) return;
    current = current.options[path[depth - 1]].next;
  });
  return current;
}