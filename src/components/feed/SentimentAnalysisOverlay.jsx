import { useEffect, useState } from 'react';
import { Meh, Frown, Heart, ThumbsUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SentimentAnalysisOverlay({ content }) {
  const [sentiment, setSentiment] = useState(null);

  useEffect(() => {
    if (!content) return;
    
    const analysis = analyzeSentiment(content);
    setSentiment(analysis);
  }, [content]);

  if (!sentiment) return null;

  const icons = {
    very_positive: { Icon: Heart, color: 'text-red-400', bg: 'bg-red-500/10' },
    positive: { Icon: ThumbsUp, color: 'text-green-400', bg: 'bg-green-500/10' },
    neutral: { Icon: Meh, color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
    negative: { Icon: Frown, color: 'text-orange-400', bg: 'bg-orange-500/10' }
  };

  const config = icons[sentiment.type] || icons.neutral;
  const Icon = config.Icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1.5 px-2 py-1 ${config.bg} rounded-lg border border-white/5`}
    >
      <Icon className={`w-3 h-3 ${config.color}`} />
      <span className={`text-[10px] font-medium ${config.color}`}>
        {sentiment.label}
      </span>
    </motion.div>
  );
}

function analyzeSentiment(text) {
  const positive = ['super', 'toll', 'gut', 'liebe', 'schön', 'perfekt', 'genial', 'wow', '❤️', '😊', '🔥'];
  const negative = ['schlecht', 'problem', 'fehler', 'schade', 'nervig', 'kaputt', '😢', '😠'];
  
  const words = text.toLowerCase();
  let score = 0;
  
  positive.forEach(word => {
    if (words.includes(word)) score += 2;
  });
  
  negative.forEach(word => {
    if (words.includes(word)) score -= 2;
  });

  if (score >= 4) return { type: 'very_positive', label: 'Sehr positiv', score };
  if (score >= 1) return { type: 'positive', label: 'Positiv', score };
  if (score <= -2) return { type: 'negative', label: 'Negativ', score };
  return { type: 'neutral', label: 'Neutral', score };
}