import { motion } from 'framer-motion';

export default function TypingIndicatorBubble({ senderInfo }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-2 items-end"
    >
      {senderInfo?.avatar_url ? (
        <img
          src={senderInfo.avatar_url}
          alt={senderInfo.name}
          className="w-8 h-8 rounded-full object-cover"
        />
      ) : (
        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
          {senderInfo?.name?.[0]?.toUpperCase() || '?'}
        </div>
      )}

      <div className="bg-zinc-800 px-4 py-3 rounded-2xl rounded-bl-md">
        <div className="flex gap-1.5">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 0.9, delay: 0 }}
            className="w-2 h-2 bg-zinc-500 rounded-full"
          />
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 0.9, delay: 0.15 }}
            className="w-2 h-2 bg-zinc-500 rounded-full"
          />
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 0.9, delay: 0.3 }}
            className="w-2 h-2 bg-zinc-500 rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
}