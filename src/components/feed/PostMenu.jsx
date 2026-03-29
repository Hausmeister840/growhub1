import { useState } from 'react';
import { MoreVertical, Edit, Trash2, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function PostMenu({ post, isOwnPost, onEdit, onDelete, onReport }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <Button
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        variant="ghost"
        size="icon"
        className="text-zinc-400 hover:text-white"
      >
        <MoreVertical className="w-5 h-5" />
      </Button>

      <AnimatePresence>
        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 top-full mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50 min-w-[200px]"
            >
              {isOwnPost ? (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onEdit?.(post);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-800 transition-colors text-white"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="text-sm">Bearbeiten</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      if (confirm('Post wirklich löschen?')) {
                        onDelete?.(post.id);
                      }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-800 transition-colors text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm">Löschen</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onReport?.(post);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-800 transition-colors text-red-400"
                >
                  <Flag className="w-4 h-4" />
                  <span className="text-sm">Melden</span>
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}