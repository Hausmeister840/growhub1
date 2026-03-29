import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

/**
 * 🔔 MESSAGE NOTIFICATION - Toast-style notification for new messages
 */

export default function MessageNotification({ message, conversation, onClose }) {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClick = () => {
    navigate(createPageUrl(`Messages?conversation=${conversation?.id}`));
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleClose = (e) => {
    e.stopPropagation();
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!message) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          className="fixed top-20 right-4 z-50 max-w-sm"
          onClick={handleClick}
        >
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-4 cursor-pointer hover:border-green-500/50 transition-colors">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-white text-sm">
                    Neue Nachricht
                  </p>
                  <button
                    onClick={handleClose}
                    className="text-zinc-500 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-zinc-400 line-clamp-2">
                  {message.content}
                </p>
                {conversation && (
                  <p className="text-xs text-zinc-600 mt-1">
                    {conversation.name || 'Chat'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}