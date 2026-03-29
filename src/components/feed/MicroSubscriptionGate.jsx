import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function MicroSubscriptionGate({ post, author, children }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const isPremium = post.premium_content || false;
  const price = post.micro_price || 0.99;

  const unlock = async () => {
    toast.info('Verarbeite Zahlung...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsUnlocked(true);
    toast.success(`Premium-Content freigeschaltet für €${price}! 🎉`);
  };

  if (!isPremium || isUnlocked) {
    return children;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-yellow-500/30 rounded-3xl p-8 min-h-[300px] flex items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5" />
      
      <div className="text-center space-y-6 relative z-10">
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full flex items-center justify-center"
        >
          <Lock className="w-10 h-10 text-yellow-400" />
        </motion.div>

        <div>
          <h3 className="text-white font-bold text-xl mb-2">
            Premium Content
          </h3>
          <p className="text-zinc-400 text-sm">
            Unterstütze {author.full_name || author.username} und schalte exklusiven Content frei
          </p>
        </div>

        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold text-white">€{price}</span>
          <span className="text-zinc-500 text-sm">einmalig</span>
        </div>

        <button
          onClick={unlock}
          className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-2xl font-bold flex items-center gap-2 mx-auto shadow-xl shadow-yellow-500/30"
        >
          <Zap className="w-5 h-5" />
          Jetzt freischalten
        </button>

        <p className="text-xs text-zinc-600">
          Sichere Zahlung • Sofortiger Zugriff • Einmalige Gebühr
        </p>
      </div>
    </motion.div>
  );
}