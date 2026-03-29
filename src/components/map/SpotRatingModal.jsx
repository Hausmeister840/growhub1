import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Star, Send, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function SpotRatingModal({ spot, currentUser, onClose, onRated }) {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (score === 0) { toast.error('Bitte Bewertung wählen'); return; }
    setSaving(true);
    try {
      const existing = spot.ratings || [];
      const filtered = existing.filter(r => r.user_email !== currentUser.email);
      const newRatings = [...filtered, {
        user_email: currentUser.email,
        score,
        comment: comment.trim(),
        created_at: new Date().toISOString(),
      }];
      const avg = newRatings.reduce((s, r) => s + r.score, 0) / newRatings.length;

      await base44.entities.CommunitySpot.update(spot.id, {
        ratings: newRatings,
        avg_rating: Math.round(avg * 10) / 10,
      });
      toast.success('Bewertung gespeichert!');
      onRated?.({ ...spot, ratings: newRatings, avg_rating: avg });
      onClose();
    } catch {
      toast.error('Fehler');
    } finally {
      setSaving(false);
    }
  }, [spot, score, comment, currentUser, onClose, onRated]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1003] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="w-full max-w-sm bg-zinc-900 rounded-3xl border border-zinc-800 p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white">Bewerten</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-zinc-400">{spot.name}</p>

        <div className="flex justify-center gap-2 py-2">
          {[1, 2, 3, 4, 5].map(i => (
            <button key={i} onClick={() => setScore(i)} className="transition-transform hover:scale-110">
              <Star className={`w-8 h-8 ${i <= score ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-700'}`} />
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Kommentar (optional)"
          rows={2}
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm placeholder-zinc-500 resize-none focus:outline-none focus:border-green-500/50"
        />

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full py-3 bg-green-500 text-black font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Bewertung abgeben
        </button>
      </motion.div>
    </motion.div>
  );
}