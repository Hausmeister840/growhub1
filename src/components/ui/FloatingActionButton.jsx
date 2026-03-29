import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

export default function FloatingActionButton({ onClick, isVisible = true, user }) {
  if (!user || !isVisible) return null;

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="fixed bottom-20 md:bottom-6 right-4 z-50 w-11 h-11 bg-zinc-800/90 backdrop-blur-sm border border-zinc-700/50 hover:bg-green-600/90 hover:border-green-500/50 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center"
      aria-label="Neuen Post erstellen"
    >
      <Plus className="w-5 h-5 text-zinc-300 hover:text-white transition-colors duration-200" strokeWidth={2} />
    </motion.button>
  );
}