import { Shield, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BlockchainContentVerifier({ post }) {
  const isVerified = post.blockchain_verified || false;
  const timestamp = post.blockchain_timestamp || post.created_date;
  const hash = post.content_hash || generateSimpleHash(post.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl"
    >
      {isVerified ? (
        <>
          <Shield className="w-3.5 h-3.5 text-green-400" />
          <span className="text-xs text-green-400 font-medium">Blockchain-verifiziert</span>
        </>
      ) : (
        <>
          <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-xs text-yellow-400 font-medium">Nicht verifiziert</span>
        </>
      )}
      
      <div className="text-[10px] text-zinc-600 ml-2">
        Hash: {hash.slice(0, 8)}...
      </div>
    </motion.div>
  );
}

function generateSimpleHash(content) {
  if (!content) return '00000000';
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}