import { motion } from 'framer-motion';

/**
 * Skeleton Loading Components
 */

export function PostSkeleton() {
  return (
    <div className="bg-black border-b border-zinc-900 p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-zinc-900 animate-pulse" />
        <div className="flex-1">
          <div className="h-4 w-32 bg-zinc-900 rounded animate-pulse mb-2" />
          <div className="h-3 w-24 bg-zinc-900 rounded animate-pulse" />
        </div>
      </div>
      <div className="space-y-2 mb-3">
        <div className="h-3 bg-zinc-900 rounded animate-pulse" />
        <div className="h-3 bg-zinc-900 rounded animate-pulse w-5/6" />
      </div>
      <div className="aspect-video bg-zinc-900 rounded-xl animate-pulse mb-3" />
      <div className="flex gap-6">
        <div className="h-4 w-12 bg-zinc-900 rounded animate-pulse" />
        <div className="h-4 w-12 bg-zinc-900 rounded animate-pulse" />
        <div className="h-4 w-12 bg-zinc-900 rounded animate-pulse" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-black">
      <div className="aspect-[3/1] bg-zinc-900 animate-pulse" />
      <div className="px-6 -mt-16 mb-6">
        <div className="w-32 h-32 rounded-full bg-zinc-800 animate-pulse border-4 border-black" />
      </div>
      <div className="px-6 space-y-4">
        <div className="h-6 w-48 bg-zinc-900 rounded animate-pulse" />
        <div className="h-4 w-32 bg-zinc-900 rounded animate-pulse" />
        <div className="h-3 bg-zinc-900 rounded animate-pulse w-2/3" />
        <div className="flex gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-1 h-16 bg-zinc-900 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function CommentSkeleton() {
  return (
    <div className="p-4 border-b border-zinc-900">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-zinc-900 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 bg-zinc-900 rounded animate-pulse" />
          <div className="h-3 bg-zinc-900 rounded animate-pulse w-5/6" />
          <div className="h-3 bg-zinc-900 rounded animate-pulse w-4/6" />
        </div>
      </div>
    </div>
  );
}

export function DiaryCardSkeleton() {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="aspect-video bg-zinc-900 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-5 w-3/4 bg-zinc-900 rounded animate-pulse" />
        <div className="h-3 w-full bg-zinc-900 rounded animate-pulse" />
        <div className="h-3 w-2/3 bg-zinc-900 rounded animate-pulse" />
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-zinc-900 rounded-full animate-pulse" />
          <div className="h-6 w-16 bg-zinc-900 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="aspect-square bg-zinc-900 animate-pulse" />
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 bg-black">
          <div className="w-12 h-12 rounded-full bg-zinc-900 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-zinc-900 rounded animate-pulse" />
            <div className="h-3 w-24 bg-zinc-900 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SpinnerOverlay({ message = 'Laden...' }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full"
        />
        <p className="text-zinc-400 text-sm">{message}</p>
      </div>
    </div>
  );
}

export function InlineSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3'
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
      className={`${sizes[size]} border-green-500 border-t-transparent rounded-full ${className}`}
    />
  );
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  actionLabel 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16 px-6"
    >
      <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-zinc-400 mb-6 max-w-sm mx-auto">{description}</p>
      {action && actionLabel && (
        <button
          onClick={action}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-full font-semibold transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}