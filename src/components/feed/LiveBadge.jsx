import { motion } from 'framer-motion';
import { Radio } from 'lucide-react';

export default function LiveBadge() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="flex items-center gap-1.5 px-2.5 py-1 bg-red-600 rounded-full"
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <Radio className="w-3 h-3 text-white" />
      </motion.div>
      <span className="text-white text-xs font-bold uppercase tracking-wide">
        Live
      </span>
    </motion.div>
  );
}