import React from 'react';
import { COMPONENTS, cn } from '../design/DesignSystem';

/**
 * 🎨 MODERN AVATAR - Design System Component
 */

export default function ModernAvatar({
  src,
  alt,
  fallback,
  size = 'md',
  active = false,
  className = '',
  onClick,
  ...props
}) {
  const avatarClass = cn(
    COMPONENTS.avatar.base,
    COMPONENTS.avatar.sizes[size],
    active ? COMPONENTS.avatar.border.active : COMPONENTS.avatar.border.default,
    onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
    className
  );

  const [hasError, setHasError] = React.useState(false);

  if (!src || hasError) {
    return (
      <div
        className={cn(avatarClass, 'bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold')}
        onClick={onClick}
        {...props}
      >
        {fallback || '?'}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={avatarClass}
      onClick={onClick}
      onError={() => setHasError(true)}
      {...props}
    />
  );
}