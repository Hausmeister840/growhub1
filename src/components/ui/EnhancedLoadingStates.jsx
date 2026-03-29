import { Loader2 } from 'lucide-react';

// Spinner für Buttons und kleine Bereiche
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };
  
  return (
    <Loader2 className={`animate-spin text-green-500 ${sizes[size]} ${className}`} />
  );
};

// Skeleton für Posts
export const PostSkeleton = () => (
  <div className="bg-gray-900 rounded-xl overflow-hidden animate-pulse">
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-800 rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-gray-800 rounded w-24 mb-2" />
          <div className="h-3 bg-gray-800 rounded w-16" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-800 rounded w-full" />
        <div className="h-4 bg-gray-800 rounded w-3/4" />
      </div>
    </div>
    <div className="h-64 bg-gray-800" />
    <div className="p-4 flex gap-4">
      <div className="h-8 bg-gray-800 rounded-full w-16" />
      <div className="h-8 bg-gray-800 rounded-full w-16" />
    </div>
  </div>
);

// Skeleton für Profile
export const ProfileHeaderSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-32 bg-gray-800 rounded-t-xl" />
    <div className="px-4 pb-4">
      <div className="w-20 h-20 bg-gray-700 rounded-full -mt-10 border-4 border-black" />
      <div className="mt-3 space-y-2">
        <div className="h-5 bg-gray-800 rounded w-32" />
        <div className="h-4 bg-gray-800 rounded w-24" />
      </div>
    </div>
  </div>
);

// Skeleton für Cards
export const CardSkeleton = () => (
  <div className="bg-gray-900 rounded-xl p-4 animate-pulse">
    <div className="h-32 bg-gray-800 rounded-lg mb-3" />
    <div className="h-4 bg-gray-800 rounded w-3/4 mb-2" />
    <div className="h-3 bg-gray-800 rounded w-1/2" />
  </div>
);

// Full Page Loading
export const PageLoader = ({ message = 'Laden...' }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-black">
    <div className="relative mb-4">
      <div className="w-16 h-16 border-4 border-green-500/30 rounded-full" />
      <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin absolute top-0" />
    </div>
    <p className="text-gray-400 text-sm">{message}</p>
  </div>
);

// Empty State
export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action 
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    {Icon && (
      <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-600" />
      </div>
    )}
    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
    <p className="text-gray-500 mb-4 max-w-sm text-sm">{description}</p>
    {action}
  </div>
);

// Grid Skeleton
export const GridSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

// List Skeleton
export const ListSkeleton = ({ count = 5 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <PostSkeleton key={i} />
    ))}
  </div>
);