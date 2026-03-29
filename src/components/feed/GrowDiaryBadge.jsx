import { Leaf } from 'lucide-react';

/**
 * Shows a small info bar on feed posts that are grow diary updates.
 * Extracts day number & stage from the post content.
 */
export default function GrowDiaryBadge({ post }) {
  // Try to extract Tag XX and stage from the content
  const dayMatch = post.content?.match(/Tag\s+(\d+)/);
  const dayNumber = dayMatch ? dayMatch[1] : null;
  
  const stages = ['Keimung', 'Sämling', 'Wachstum', 'Blüte', 'Spülung', 'Ernte'];
  const foundStage = stages.find(s => post.content?.includes(s) || post.tags?.includes(s));

  const stageEmoji = {
    'Keimung': '🌱', 'Sämling': '🌿', 'Wachstum': '🌳',
    'Blüte': '🌸', 'Spülung': '💧', 'Ernte': '🏆'
  };

  return (
    <div className="mx-3 mb-2 flex items-center gap-2 flex-wrap">
      <span className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600/25 border border-green-500/40 rounded-lg text-xs font-semibold text-green-300">
        <Leaf className="w-3 h-3" />
        Grow-Update
      </span>
      {dayNumber && (
        <span className="px-2.5 py-1.5 bg-zinc-700 rounded-lg text-xs font-semibold text-zinc-100">
          Tag {dayNumber}
        </span>
      )}
      {foundStage && (
        <span className="px-2.5 py-1.5 bg-zinc-700 rounded-lg text-xs font-semibold text-zinc-100">
          {stageEmoji[foundStage] || '🌿'} {foundStage}
        </span>
      )}
    </div>
  );
}