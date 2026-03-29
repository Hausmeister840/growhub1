import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles, LogIn } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function FeedAuthBanner() {
  const handleLogin = () => {
    base44.auth.redirectToLogin();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mt-4 mb-6 p-6 rounded-3xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30"
    >
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        
        <div>
          <h3 className="text-xl font-bold text-white mb-2">
            Entdecke personalisierte Inhalte
          </h3>
          <p className="text-zinc-400 text-sm">
            Melde dich an, um deinen Feed zu personalisieren, Posts zu liken und mit der Community zu interagieren
          </p>
        </div>

        <Button
          onClick={handleLogin}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-8"
        >
          <LogIn className="w-5 h-5 mr-2" />
          Jetzt anmelden
        </Button>
      </div>
    </motion.div>
  );
}