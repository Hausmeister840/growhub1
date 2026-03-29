import { forwardRef } from 'react';
import { COMPONENTS, cn } from '../design/DesignSystem';

/**
 * 🎨 MODERN INPUT - Design System Component
 */

const ModernInput = forwardRef(({
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  fullWidth = true,
  icon,
  iconPosition = 'left',
  className = '',
  ...props
}, ref) => {
  const inputClass = cn(
    COMPONENTS.input.base,
    error && COMPONENTS.input.error,
    !fullWidth && 'w-auto',
    icon && iconPosition === 'left' && 'pl-10',
    icon && iconPosition === 'right' && 'pr-10',
    className
  );

  return (
    <div className="relative">
      {icon && iconPosition === 'left' && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
          {icon}
        </div>
      )}
      
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={inputClass}
        {...props}
      />

      {icon && iconPosition === 'right' && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
          {icon}
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
});

ModernInput.displayName = 'ModernInput';

export default ModernInput;