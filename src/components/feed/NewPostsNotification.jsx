import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NewPostsNotification({ count, onLoad }) {
  if (!count || count === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 lg:top-6"
      >
        <Button
          onClick={onLoad}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold shadow-lg shadow-green-500/30 rounded-full px-6 py-3 flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>
            {count === 1 ? 'Neuer Post' : `${count} neue Posts`}
          </span>
          <ArrowUp className="w-4 h-4" />
        </Button>
      </motion.div>
    </AnimatePresence>
  );
}