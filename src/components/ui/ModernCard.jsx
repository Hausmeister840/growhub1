import { motion } from 'framer-motion';
import { COMPONENTS, ANIMATIONS, cn } from '../design/DesignSystem';

/**
 * 🎨 MODERN CARD - Design System Component
 */

export default function ModernCard({
  children,
  hover = false,
  interactive = false,
  elevated = false,
  padding = 'md',
  className = '',
  onClick,
  ...props
}) {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  };

  const cardClass = cn(
    COMPONENTS.card.base,
    hover && COMPONENTS.card.hover,
    interactive && COMPONENTS.card.interactive,
    elevated && COMPONENTS.card.elevated,
    paddingClasses[padding],
    className
  );

  const Component = interactive || onClick ? motion.div : 'div';

  const motionProps = interactive || onClick ? {
    initial: ANIMATIONS.scaleIn.initial,
    animate: ANIMATIONS.scaleIn.animate,
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { duration: 0.2 },
  } : {};

  return (
    <Component
      className={cardClass}
      onClick={onClick}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
}