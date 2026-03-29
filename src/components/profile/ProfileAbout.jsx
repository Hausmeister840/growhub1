import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function ProfileAbout({ user }) {
  const [expanded, setExpanded] = useState(false);

  const bioLength = user.bio?.length || 0;
  const shouldTruncate = bioLength > 200;
  const displayBio = shouldTruncate && !expanded ? user.bio.slice(0, 200) + '...' : user.bio;

  const hasInterests = user.interests && user.interests.length > 0;
  const hasContent = user.bio || hasInterests;

  if (!hasContent) return null;

  return (
    <div className="space-y-3">
      {user.bio && (
        <div>
          <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{displayBio}</p>
          {shouldTruncate && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-green-400 hover:text-green-300 flex items-center gap-0.5 mt-1 transition-colors"
            >
              {expanded ? <>Weniger <ChevronUp className="w-3 h-3" /></> : <>Mehr <ChevronDown className="w-3 h-3" /></>}
            </button>
          )}
        </div>
      )}

      {hasInterests && (
        <div className="flex flex-wrap gap-1.5">
          {user.interests.map((interest, i) => (
            <Badge key={i} variant="outline" className="bg-white/[0.03] border-white/[0.08] text-zinc-400 text-xs rounded-lg px-2.5 py-1">
              {interest}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}