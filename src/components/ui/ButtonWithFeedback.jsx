import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { cn } from '@/lib/utils';

/**
 * 🎯 BUTTON WITH FEEDBACK - Button mit haptischem & visuellem Feedback
 */

export default function ButtonWithFeedback({
  children,
  onClick,
  isLoading = false,
  success = false,
  haptic = 'medium',
  className,
  ...props
}) {
  const [isPressed, setIsPressed] = useState(false);
  const { light, medium, heavy, success: successVibrate } = useHapticFeedback();

  const handleClick = async (e) => {
    if (isLoading || success) return;

    // Haptic feedback
    if (haptic === 'light') light();
    else if (haptic === 'medium') medium();
    else if (haptic === 'heavy') heavy();

    // Visual feedback
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);

    // Execute onClick
    if (onClick) {
      const result = await onClick(e);
      if (result === true) {
        successVibrate();
      }
    }
  };

  return (
    <motion.div
      animate={isPressed ? { scale: 0.95 } : { scale: 1 }}
      transition={{ duration: 0.1 }}
    >
      <Button
        onClick={handleClick}
        disabled={isLoading || success}
        className={cn(
          'transition-all duration-200',
          success && 'bg-green-600 hover:bg-green-600',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Lädt...
          </>
        ) : success ? (
          <>
            <Check className="w-4 h-4 mr-2" />
            Erfolgreich
          </>
        ) : (
          children
        )}
      </Button>
    </motion.div>
  );
}