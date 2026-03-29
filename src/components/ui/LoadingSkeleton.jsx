
export function PostSkeleton() {
  return (
    <div className="gh-card overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/[0.04] animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-white/[0.04] rounded-lg animate-pulse w-28" />
          <div className="h-2.5 bg-white/[0.03] rounded-lg animate-pulse w-16" />
        </div>
      </div>
      {/* Content */}
      <div className="px-4 pb-3 space-y-2">
        <div className="h-3.5 bg-white/[0.04] rounded-lg animate-pulse w-full" />
        <div className="h-3.5 bg-white/[0.04] rounded-lg animate-pulse w-3/4" />
      </div>
      {/* Media */}
      <div className="mx-4 mb-3 h-56 bg-white/[0.03] rounded-[var(--gh-radius-lg)] animate-pulse relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent animate-shimmer" />
      </div>
      {/* Actions */}
      <div className="px-4 py-3 border-t border-white/[0.04] flex items-center gap-3">
        <div className="h-8 bg-white/[0.03] rounded-full animate-pulse w-16" />
        <div className="h-8 bg-white/[0.03] rounded-full animate-pulse w-16" />
        <div className="h-8 bg-white/[0.03] rounded-full animate-pulse w-10" />
        <div className="h-8 w-8 bg-white/[0.03] rounded-full animate-pulse ml-auto" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6 pt-4">
      <div className="px-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-white/[0.04] animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-white/[0.04] rounded animate-pulse w-40" />
          <div className="h-3.5 bg-white/[0.03] rounded animate-pulse w-28" />
        </div>
      </div>
      <div className="px-6">
        <div className="h-3.5 bg-white/[0.03] rounded animate-pulse w-full mb-2" />
        <div className="h-3.5 bg-white/[0.03] rounded animate-pulse w-2/3" />
      </div>
      <div className="grid grid-cols-4 gap-3 px-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="gh-card p-3 text-center space-y-2">
            <div className="h-6 bg-white/[0.04] rounded animate-pulse" />
            <div className="h-2.5 bg-white/[0.03] rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DiaryCardSkeleton() {
  return (
    <div className="gh-card overflow-hidden">
      <div className="h-40 bg-white/[0.03] animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-white/[0.04] rounded animate-pulse w-3/4" />
        <div className="h-3 bg-white/[0.03] rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="gh-card overflow-hidden">
      <div className="aspect-square bg-white/[0.03] animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 bg-white/[0.04] rounded-full animate-pulse w-20" />
          <div className="h-5 bg-white/[0.04] rounded-full animate-pulse w-16" />
        </div>
        <div className="h-5 bg-white/[0.04] rounded animate-pulse w-full" />
        <div className="flex justify-between items-center pt-2 border-t border-white/[0.04]">
          <div className="h-7 bg-white/[0.04] rounded animate-pulse w-20" />
          <div className="h-3.5 bg-white/[0.03] rounded animate-pulse w-16" />
        </div>
      </div>
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-10 h-10 rounded-full bg-white/[0.04] animate-pulse flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-white/[0.04] rounded animate-pulse w-28" />
        <div className="h-14 bg-white/[0.03] rounded-[var(--gh-radius-lg)] animate-pulse w-full" />
      </div>
    </div>
  );
}

export function ConversationSkeleton() {
  return (
    <div className="p-4 flex items-center gap-3 border-b border-white/[0.04]">
      <div className="w-12 h-12 rounded-full bg-white/[0.04] animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-white/[0.04] rounded animate-pulse w-28" />
        <div className="h-3 bg-white/[0.03] rounded animate-pulse w-44" />
      </div>
    </div>
  );
}