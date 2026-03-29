import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * ⏳ LOADING SPINNER - SINGLE SOURCE
 */

export default function LoadingSpinner({
  size = 'md',
  text,
  fullScreen = false,
  className = '',
}) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 className={`${sizes[size]} text-green-500 animate-spin`} />
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-zinc-400"
        >
          {text}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}