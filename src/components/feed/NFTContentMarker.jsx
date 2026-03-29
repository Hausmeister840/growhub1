import { motion } from 'framer-motion';
import { Image, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

export default function NFTContentMarker({ post, author }) {
  const isNFT = post.is_nft || false;
  const price = post.nft_price || 0;
  const available = post.nft_available || true;

  if (!isNFT) return null;

  const purchaseNFT = async () => {
    toast.info('Öffne NFT-Marktplatz...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('NFT-Kauf-Seite geöffnet! 🎨');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Image className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-semibold text-purple-400">NFT Artwork</span>
          </div>
          <p className="text-sm text-white font-semibold">Einzigartige digitale Kunst</p>
          <p className="text-xs text-zinc-500">Von {author.full_name || author.username}</p>
        </div>

        {available && (
          <div className="text-right">
            <div className="text-2xl font-bold text-white mb-1">{price} ETH</div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={purchaseNFT}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-lg shadow-purple-500/30"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Kaufen
            </motion.button>
          </div>
        )}

        {!available && (
          <div className="px-4 py-2 bg-white/5 rounded-xl text-xs text-zinc-500">
            Verkauft
          </div>
        )}
      </div>
    </motion.div>
  );
}