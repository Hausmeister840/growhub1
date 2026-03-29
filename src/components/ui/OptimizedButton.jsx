import { memo } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const OptimizedButton = memo(({ 
  children, 
  onClick, 
  variant = 'default',
  size = 'default',
  loading = false,
  disabled = false,
  className,
  icon: Icon,
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    default: 'bg-[#00FF88] text-black hover:bg-[#00DD77] focus:ring-[#00FF88] shadow-lg shadow-[#00FF88]/20',
    outline: 'border-2 border-zinc-800 text-white hover:bg-zinc-900 focus:ring-zinc-700',
    ghost: 'text-zinc-400 hover:text-white hover:bg-zinc-900',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    default: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3.5 text-lg',
  };

  const buttonClasses = [
    baseStyles,
    variants[variant] || variants.default,
    sizes[size] || sizes.default,
    className
  ].filter(Boolean).join(' ');

  return (
    <motion.button
      whileTap={{ scale: disabled || loading ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={buttonClasses}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
    </motion.button>
  );
});

OptimizedButton.displayName = 'OptimizedButton';

export default OptimizedButton;