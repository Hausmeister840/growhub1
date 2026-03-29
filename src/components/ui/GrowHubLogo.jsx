import { motion } from 'framer-motion';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6886522bef1fa5b41bb683d6/8530ee5ba_IMG_1376.jpeg";

export default function GrowHubLogo({ size = 'default', minimal = false, className = '' }) {
  const sizes = {
    small: 'h-8',
    default: 'h-10',
    large: 'h-12',
    xl: 'h-16'
  };

  const currentSize = sizes[size] || sizes.default;

  if (minimal) {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`${currentSize} aspect-square flex items-center justify-center ${className}`}
      >
        <img 
          src={LOGO_URL} 
          alt="GrowHub"
          className="w-full h-full object-contain rounded-xl"
          style={{ 
            filter: 'drop-shadow(0 4px 12px rgba(34, 197, 94, 0.3))'
          }}
        />
      </motion.div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`${currentSize} aspect-square flex items-center justify-center`}
      >
        <img 
          src={LOGO_URL} 
          alt="GrowHub"
          className="w-full h-full object-contain rounded-xl"
          style={{ 
            filter: 'drop-shadow(0 4px 12px rgba(34, 197, 94, 0.3))'
          }}
        />
      </motion.div>
      
      <span className="text-xl font-bold text-white tracking-tight">
        Grow<span className="text-[var(--gh-accent)]">Hub</span>
      </span>
    </div>
  );
}