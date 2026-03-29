
/**
 * 📱 MOBILE-OPTIMIZED COMPONENTS
 * Performance-optimierte Mobile Components
 */

// Optimized Button for Mobile
export function MobileButton({ children, onClick, variant = 'primary', size = 'md', className = '', ...props }) {
  const baseClasses = 'font-semibold rounded-xl transition-all active:scale-95 touch-manipulation';
  
  const variants = {
    primary: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30 active:shadow-green-500/50',
    secondary: 'bg-zinc-800 text-white hover:bg-zinc-700',
    ghost: 'text-zinc-400 hover:text-white hover:bg-zinc-800',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// Optimized Input for Mobile
export function MobileInput({ type = 'text', placeholder, value, onChange, className = '', ...props }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all text-base ${className}`}
      {...props}
    />
  );
}

// Optimized Card for Mobile
export function MobileCard({ children, className = '', onClick, ...props }) {
  return (
    <div
      onClick={onClick}
      className={`bg-zinc-900 border border-zinc-800 rounded-2xl p-4 ${onClick ? 'active:scale-[0.98] cursor-pointer' : ''} transition-all ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// Optimized List for Mobile
export function MobileList({ items, renderItem, className = '' }) {
  return (
    <div className={`divide-y divide-zinc-800 ${className}`}>
      {items.map((item, index) => (
        <div key={index} className="py-3">
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}

// Optimized Bottom Sheet
export function MobileBottomSheet({ isOpen, onClose, children, title }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 rounded-t-3xl border-t border-zinc-800 max-h-[90vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1 bg-zinc-700 rounded-full" />
        </div>

        {/* Title */}
        {title && (
          <div className="px-6 pb-4 border-b border-zinc-800">
            <h2 className="text-xl font-bold text-white">{title}</h2>
          </div>
        )}

        {/* Content */}
        <div className="p-6 pb-safe">
          {children}
        </div>
      </div>
    </>
  );
}

export default {
  Button: MobileButton,
  Input: MobileInput,
  Card: MobileCard,
  List: MobileList,
  BottomSheet: MobileBottomSheet
};