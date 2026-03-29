import { Leaf } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SustainabilityScore({ post }) {
  const score = calculateSustainabilityScore(post);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl"
    >
      <Leaf className="w-3.5 h-3.5 text-green-400" />
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`w-1 h-3 rounded-full ${
              i < score ? 'bg-green-400' : 'bg-white/10'
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-green-400 font-medium ml-1">
        Öko-Score {score}/5
      </span>
    </motion.div>
  );
}

function calculateSustainabilityScore(post) {
  let score = 3;

  if (post.tags?.includes('bio') || post.tags?.includes('organic')) score++;
  if (post.tags?.includes('nachhaltig') || post.tags?.includes('sustainable')) score++;
  if (post.media_urls?.length === 0) score++;
  if (post.content?.includes('umwelt') || post.content?.includes('klima')) score++;
  
  return Math.min(Math.max(score, 0), 5);
}