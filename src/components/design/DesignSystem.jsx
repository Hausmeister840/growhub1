/**
 * 🎨 GROWHUB DESIGN SYSTEM
 * Zentrale Design-Tokens für konsistente UI
 */

export const COLORS = {
  // Backgrounds
  bg: {
    primary: '#0a0a0a',
    secondary: '#141414',
    card: '#18181b',
    hover: '#27272a',
    elevated: '#1f1f23',
    overlay: 'rgba(0, 0, 0, 0.85)',
  },

  // Brand Colors
  brand: {
    green: '#10B981',
    greenHover: '#059669',
    greenLight: '#34D399',
    greenDark: '#047857',
  },

  // Accent Colors
  accent: {
    blue: '#3B82F6',
    purple: '#8B5CF6',
    orange: '#F59E0B',
    red: '#EF4444',
    pink: '#EC4899',
    cyan: '#06B6D4',
    lime: '#84CC16',
  },

  // Text
  text: {
    primary: '#FFFFFF',
    secondary: '#A1A1AA',
    tertiary: '#71717A',
    disabled: '#52525B',
    inverse: '#000000',
  },

  // Borders
  border: {
    default: 'rgba(63, 63, 70, 0.5)',
    hover: 'rgba(63, 63, 70, 0.8)',
    active: 'rgba(16, 185, 129, 0.3)',
  },

  // Status
  status: {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
  },

  // Social
  social: {
    like: '#EF4444',
    fire: '#F59E0B',
    laugh: '#F59E0B',
    mindBlown: '#8B5CF6',
    helpful: '#10B981',
    celebrate: '#EC4899',
  },
};

export const SPACING = {
  xs: '0.5rem',   // 8px
  sm: '0.75rem',  // 12px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',  // 48px
  '3xl': '4rem',  // 64px
};

export const BORDER_RADIUS = {
  none: '0',
  sm: '0.5rem',   // 8px
  md: '0.75rem',  // 12px
  lg: '1rem',     // 16px
  xl: '1.5rem',   // 24px
  '2xl': '2rem',  // 32px
  full: '9999px',
};

export const SHADOWS = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
  glow: '0 0 20px rgba(16, 185, 129, 0.3)',
  glowStrong: '0 0 30px rgba(16, 185, 129, 0.5)',
};

export const TYPOGRAPHY = {
  // Font Sizes
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '0.9375rem', // 15px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },

  // Font Weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // Line Heights
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
};

export const TRANSITIONS = {
  fast: '150ms ease-in-out',
  normal: '200ms ease-in-out',
  slow: '300ms ease-in-out',
  all: 'all 200ms ease-in-out',
};

// ✅ COMPONENT CLASSES
export const COMPONENTS = {
  // Cards
  card: {
    base: 'bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-zinc-800/50',
    hover: 'hover:bg-zinc-900/70 hover:border-zinc-700/50 transition-all duration-200',
    interactive: 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
    elevated: 'shadow-lg shadow-black/20',
  },

  // Buttons
  button: {
    base: 'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
    sizes: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-base',
      lg: 'px-6 py-3 text-lg',
      icon: 'w-10 h-10',
    },
    variants: {
      primary: 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20',
      secondary: 'bg-zinc-800 hover:bg-zinc-700 text-white',
      outline: 'border-2 border-zinc-700 hover:border-zinc-600 text-white',
      ghost: 'hover:bg-zinc-800/50 text-zinc-300 hover:text-white',
      danger: 'bg-red-500 hover:bg-red-600 text-white',
    },
  },

  // Inputs
  input: {
    base: 'w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all',
    error: 'border-red-500 focus:ring-red-500/50',
  },

  // Badges
  badge: {
    base: 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold',
    variants: {
      green: 'bg-green-500/20 text-green-400 border border-green-500/30',
      blue: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      purple: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
      orange: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
      red: 'bg-red-500/20 text-red-400 border border-red-500/30',
      gray: 'bg-zinc-700/50 text-zinc-300 border border-zinc-600/30',
    },
  },

  // Avatars
  avatar: {
    base: 'rounded-full object-cover border-2',
    sizes: {
      xs: 'w-6 h-6',
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
      xl: 'w-16 h-16',
      '2xl': 'w-20 h-20',
    },
    border: {
      default: 'border-zinc-700',
      active: 'border-green-500',
    },
  },
};

// ✅ ANIMATION VARIANTS
export const ANIMATIONS = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },

  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },

  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },

  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },

  shimmer: {
    animate: {
      backgroundPosition: ['200% 0', '-200% 0'],
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

// ✅ UTILITY FUNCTIONS
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

export const getTextClass = (variant = 'body') => {
  const variants = {
    h1: 'text-3xl font-bold text-white',
    h2: 'text-2xl font-bold text-white',
    h3: 'text-xl font-semibold text-white',
    h4: 'text-lg font-semibold text-white',
    body: 'text-[15px] text-zinc-100',
    small: 'text-sm text-zinc-400',
    tiny: 'text-xs text-zinc-500',
  };
  return variants[variant] || variants.body;
};

export default {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  TYPOGRAPHY,
  TRANSITIONS,
  COMPONENTS,
  ANIMATIONS,
  cn,
  getTextClass,
};