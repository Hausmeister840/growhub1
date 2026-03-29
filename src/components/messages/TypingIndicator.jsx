import { motion } from 'framer-motion';

export default function TypingIndicator({ users = [] }) {
  if (users.length === 0) return null;

  const displayText = users.length === 1
    ? `${users[0]} schreibt...`
    : users.length === 2
    ? `${users[0]} und ${users[1]} schreiben...`
    : `${users.length} Personen schreiben...`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-2 px-4 py-2 text-zinc-500 text-sm"
    >
      <div className="flex gap-1">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1, delay: 0 }}
          className="w-2 h-2 bg-green-500 rounded-full"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
          className="w-2 h-2 bg-green-500 rounded-full"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
          className="w-2 h-2 bg-green-500 rounded-full"
        />
      </div>
      <span>{displayText}</span>
    </motion.div>
  );
}