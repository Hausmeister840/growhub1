import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Sprout, ChevronRight } from 'lucide-react';
import { DiaryCardSkeleton } from '@/components/ui/LoadingSkeleton';

export default function ProfileGrowDiaries({ diaries = [], isLoading, showAll = false, onViewAll }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[1, 2, 3].map(i => <DiaryCardSkeleton key={i} />)}
      </div>
    );
  }

  if (diaries.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-3 border-2 border-zinc-800 rounded-full flex items-center justify-center">
          <Sprout className="w-7 h-7 text-zinc-600" />
        </div>
        <p className="text-zinc-500 text-sm">Noch keine Grows</p>
      </div>
    );
  }

  return (
    <div>
      {!showAll && onViewAll && diaries.length >= 3 && (
        <div className="flex justify-end mb-2">
          <button onClick={onViewAll} className="text-xs text-green-400 hover:text-green-300 flex items-center gap-0.5 transition-colors">
            Alle anzeigen <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {diaries.map((diary, i) => {
          const stageEmoji = diary.current_stage === 'Blüte' ? '🌸' : diary.current_stage === 'Wachstum' ? '🌳' : diary.current_stage === 'Keimung' ? '🌱' : '🌿';
          const isActive = diary.status === 'active';

          return (
            <motion.div
              key={diary.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                to={createPageUrl(`GrowDiaryDetail?id=${diary.id}`)}
                className="block rounded-xl overflow-hidden border border-white/[0.06] hover:border-green-500/30 bg-[var(--gh-surface)] transition-all group"
              >
                {diary.cover_image_url ? (
                  <div className="relative h-28 sm:h-32 overflow-hidden">
                    <img src={diary.cover_image_url} alt={diary.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    {isActive && <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
                  </div>
                ) : (
                  <div className="relative h-28 sm:h-32 bg-gradient-to-br from-green-500/10 to-emerald-500/5 flex items-center justify-center">
                    <span className="text-3xl">{stageEmoji}</span>
                    {isActive && <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
                  </div>
                )}

                <div className="p-2.5">
                  <p className="font-semibold text-white text-sm truncate group-hover:text-green-400 transition-colors">{diary.name}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {diary.strain_name && (
                      <span className="text-[11px] text-[var(--gh-text-muted)] truncate">{diary.strain_name}</span>
                    )}
                    {diary.current_stage && (
                      <>
                        <span className="text-[var(--gh-text-muted)]">·</span>
                        <span className="text-[11px] text-green-400/80">{diary.current_stage}</span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}