import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Coins, X, Zap } from 'lucide-react';
import { toast } from 'sonner';

const tipAmounts = [
  { amount: 0.1, label: '0.1', currency: 'GHT' },
  { amount: 0.5, label: '0.5', currency: 'GHT' },
  { amount: 1, label: '1', currency: 'GHT' },
  { amount: 5, label: '5', currency: 'GHT' }
];

export default function CryptoTipping({ post, author, isOpen, onClose }) {
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const handleTip = async () => {
    if (!selectedAmount) return;

    setIsSending(true);
    try {
      // Simulate crypto transaction
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success(`${selectedAmount.amount} ${selectedAmount.currency} an ${author.username} gesendet! 🎉`);
      onClose();
    } catch (error) {
      toast.error('Transaktion fehlgeschlagen');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-zinc-900 to-purple-900/20 rounded-3xl w-full max-w-md border border-white/10 overflow-hidden"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl">
                  <Coins className="w-5 h-5 text-yellow-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Trinkgeld senden</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl">
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="text-center">
                <p className="text-zinc-400 text-sm mb-2">Sende Trinkgeld an</p>
                <p className="text-white font-semibold text-lg">{author.full_name || author.username}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {tipAmounts.map((tip) => (
                  <motion.button
                    key={tip.amount}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedAmount(tip)}
                    className={`p-4 rounded-2xl font-semibold transition-all ${
                      selectedAmount?.amount === tip.amount
                        ? 'bg-gradient-to-br from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/30'
                        : 'bg-white/5 text-zinc-400 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    <div className="text-2xl mb-1">{tip.label}</div>
                    <div className="text-xs opacity-80">{tip.currency}</div>
                  </motion.button>
                ))}
              </div>

              <button
                onClick={handleTip}
                disabled={!selectedAmount || isSending}
                className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/30"
              >
                {isSending ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    >
                      <Zap className="w-5 h-5" />
                    </motion.div>
                    Sende...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-5 h-5" />
                    Trinkgeld senden
                  </>
                )}
              </button>

              <p className="text-xs text-zinc-600 text-center">
                Powered by GrowHub Token (GHT) Blockchain
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}