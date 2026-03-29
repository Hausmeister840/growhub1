import { motion } from 'framer-motion';
import { ShieldCheck, Atom } from 'lucide-react';

export default function QuantumSecurityIndicator({ post }) {
  const isQuantumSecure = post.quantum_encrypted || true; // Default true for demo
  const encryptionLevel = post.encryption_level || 'AES-256-QR';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
      >
        <Atom className="w-3.5 h-3.5 text-cyan-400" />
      </motion.div>
      
      <div className="flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-cyan-400" />
        <span className="text-xs text-cyan-400 font-medium">
          {encryptionLevel}
        </span>
      </div>

      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
    </motion.div>
  );
}