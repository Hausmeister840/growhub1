import { COMPONENTS, cn } from '../design/DesignSystem';

/**
 * 🎨 MODERN BADGE - Design System Component
 */

export default function ModernBadge({
  children,
  variant = 'gray',
  icon,
  className = '',
  ...props
}) {
  const badgeClass = cn(
    COMPONENTS.badge.base,
    COMPONENTS.badge.variants[variant],
    className
  );

  return (
    <span className={badgeClass} {...props}>
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </span>
  );
}