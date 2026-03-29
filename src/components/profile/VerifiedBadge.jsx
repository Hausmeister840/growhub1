import { CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VerifiedBadge({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`inline-flex items-center justify-center ${className}`}
      title="Verifizierter Account"
    >
      <CheckCircle2 
        className={`${sizeClasses[size]} text-blue-500 fill-blue-500`}
      />
    </motion.div>
  );
}