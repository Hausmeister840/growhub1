import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Star } from 'lucide-react';
import { toast } from 'sonner';

export default function CollaborativeCuration({ post, currentUser }) {
  const [userRating, setUserRating] = useState(null);
  const communityScore = post.community_curation_score || 0;

  const rateContent = async (rating) => {
    if (!currentUser) {
      toast.error('Bitte melde dich an');
      return;
    }

    setUserRating(rating);
    toast.success('Bewertung gespeichert - Hilft der Community! 🌟');

    // In real implementation, save to database
    // This helps improve content quality for everyone
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
      <div className="flex items-center gap-1">
        <Star className={`w-3.5 h-3.5 ${
          communityScore > 0.7 ? 'text-yellow-400 fill-current' : 'text-zinc-600'
        }`} />
        <span className="text-xs text-zinc-500">
          {Math.round(communityScore * 100)}% Community
        </span>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <button
          onClick={() => rateContent(1)}
          className={`p-1.5 rounded-lg transition-all ${
            userRating === 1
              ? 'bg-green-500/20 text-green-400'
              : 'text-zinc-600 hover:text-green-400 hover:bg-green-500/10'
          }`}
          title="Qualitativ hochwertig"
        >
          <ThumbsUp className="w-3.5 h-3.5" />
        </button>
        
        <button
          onClick={() => rateContent(-1)}
          className={`p-1.5 rounded-lg transition-all ${
            userRating === -1
              ? 'bg-red-500/20 text-red-400'
              : 'text-zinc-600 hover:text-red-400 hover:bg-red-500/10'
          }`}
          title="Niedrige Qualität"
        >
          <ThumbsDown className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}