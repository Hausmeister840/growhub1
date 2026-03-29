
/**
 * 📱 SAFE AREA WRAPPER
 * Handles iOS notch and Android navigation
 */

export function SafeAreaTop({ children, className = '' }) {
  return (
    <div className={`pt-safe ${className}`}>
      {children}
    </div>
  );
}

export function SafeAreaBottom({ children, className = '' }) {
  return (
    <div className={`pb-safe ${className}`}>
      {children}
    </div>
  );
}

export function SafeAreaInset({ children, className = '' }) {
  return (
    <div className={`pt-safe pb-safe ${className}`}>
      {children}
    </div>
  );
}

// Add to global CSS
export const safeAreaCSS = `
  .pt-safe {
    padding-top: env(safe-area-inset-top);
  }

  .pb-safe {
    padding-bottom: env(safe-area-inset-bottom);
  }

  .pl-safe {
    padding-left: env(safe-area-inset-left);
  }

  .pr-safe {
    padding-right: env(safe-area-inset-right);
  }
`;

export default SafeAreaInset;