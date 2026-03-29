import React from 'react';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '@/entities/User';

/**
 * 🎯 FLOATING ACTION BUTTON - Post erstellen
 */

export default function CreatePostFAB({ onClick, show = true }) {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    User.me()
      .then(() => setIsAuthenticated(true))
      .catch(() => setIsAuthenticated(false));
  }, []);

  const handleClick = async () => {
    if (!isAuthenticated) {
      try {
        await User.login();
      } catch (error) {
        console.error('Login error:', error);
      }
      return;
    }

    if (onClick) {
      onClick();
    } else {
      window.dispatchEvent(new Event('openCreatePost'));
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleClick}
          className="growhub-fab fixed bottom-20 right-6 lg:bottom-8 lg:right-8 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-2xl shadow-green-500/50 flex items-center justify-center text-white font-bold hover:shadow-green-500/70 transition-shadow group"
          aria-label="Post erstellen"
        >
          <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
          
          {/* Ripple Effect */}
          <motion.div
            className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20"
            initial={{ scale: 0 }}
            whileHover={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          />
        </motion.button>
      )}
    </AnimatePresence>
  );
}