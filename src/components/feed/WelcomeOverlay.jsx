import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, TrendingUp, Users, Video, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * 🎉 WELCOME OVERLAY - Für neue User
 */

export default function WelcomeOverlay({ isOpen, onClose, onCreatePost }) {
  if (!isOpen) return null;

  const features = [
    {
      icon: TrendingUp,
      title: "Entdecke Trends",
      description: "Die besten Grow-Tips und neuesten Techniken"
    },
    {
      icon: Users,
      title: "Vernetze dich",
      description: "Folge erfahrenen Growern und lerne von den Besten"
    },
    {
      icon: Video,
      title: "Teile deine Journey",
      description: "Dokumentiere deinen Grow mit Bildern und Videos"
    },
    {
      icon: MessageCircle,
      title: "Hilf der Community",
      description: "Beantworte Fragen und teile dein Wissen"
    }
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25 }}
          className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-3xl p-8 max-w-2xl w-full relative shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>

          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/50"
            >
              <Sparkles className="w-10 h-10 text-white" />
            </motion.div>

            <h2 className="text-3xl font-bold text-white mb-2">
              Willkommen bei GrowHub! 🌱
            </h2>
            <p className="text-zinc-400">
              Die Community für Cannabis-Grower
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-green-500/50 transition-colors"
                >
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-green-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                  <p className="text-sm text-zinc-400">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => {
                onClose();
                onCreatePost();
              }}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-6 rounded-xl shadow-lg shadow-green-500/30"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Ersten Post erstellen
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-zinc-700 hover:bg-zinc-800 py-6 rounded-xl"
            >
              Feed erkunden
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}