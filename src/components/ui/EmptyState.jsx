import { motion } from 'framer-motion';
import { Button } from './button';

/**
 * 🗂️ EMPTY STATE - SINGLE SOURCE
 */

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center text-center p-8 ${className}`}
    >
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-zinc-500" />
        </div>
      )}
      
      {title && (
        <h3 className="text-lg font-semibold text-white mb-2">
          {title}
        </h3>
      )}
      
      {description && (
        <p className="text-zinc-400 text-sm max-w-sm mb-6">
          {description}
        </p>
      )}
      
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="bg-green-500 hover:bg-green-600 text-white"
        >
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}