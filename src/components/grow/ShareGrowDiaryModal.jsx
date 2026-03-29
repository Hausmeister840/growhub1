
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, Sparkles, Sprout, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ShareGrowDiaryModal({ isOpen, onClose, onSubmit, diary, entry }) {
  const [content, setContent] = useState(
    `🌱 Mein ${diary.strain_name} Grow!\n\n` +
    `${diary.current_stage} • Tag ${diary.total_days || 0}\n\n` +
    `${entry?.plant_observation || 'Die Pflanzen entwickeln sich prächtig!'}`
  );
  const [visibility, setVisibility] = useState('public');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ ESC-KEY SUPPORT
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({ content, visibility });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-card rounded-3xl max-w-2xl w-full border border-zinc-800"
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Grow im Feed teilen</h2>
              <Button onClick={onClose} variant="ghost" size="icon" className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Diary Preview */}
              <div className="glass-card rounded-2xl p-4 border border-green-500/30 bg-green-500/5">
                <div className="flex items-start gap-4">
                  {diary.cover_image_url && (
                    <img
                      src={diary.cover_image_url}
                      alt={diary.name}
                      className="w-24 h-24 rounded-xl object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-white mb-2">{diary.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center gap-1 text-sm text-zinc-400">
                        <Sprout className="w-4 h-4 text-green-400" />
                        {diary.strain_name}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-zinc-400">
                        <TrendingUp className="w-4 h-4 text-blue-400" />
                        {diary.current_stage}
                      </div>
                      {diary.total_days > 0 && (
                        <div className="flex items-center gap-1 text-sm text-zinc-400">
                          <Calendar className="w-4 h-4 text-purple-400" />
                          Tag {diary.total_days}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Input */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Was möchtest du über deinen Grow erzählen?
                </label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Teile deine Erfahrungen mit der Community..."
                  className="bg-zinc-900/50 border-zinc-700 text-white min-h-[150px]"
                  maxLength={1000}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-zinc-500">
                    {content.length}/1000 Zeichen
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setContent(content + ' #grow #cannabis #' + diary.strain_name.replace(/\s/g, ''))}
                    className="text-green-400 hover:text-green-300"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Hashtags hinzufügen
                  </Button>
                </div>
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Sichtbarkeit
                </label>
                <Select value={visibility} onValueChange={setVisibility}>
                  <SelectTrigger className="bg-zinc-900/50 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">🌍 Öffentlich - Jeder kann es sehen</SelectItem>
                    <SelectItem value="followers">👥 Follower - Nur deine Follower</SelectItem>
                    <SelectItem value="private">🔒 Privat - Nur du</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <Button
                  type="button"
                  onClick={onClose}
                  variant="ghost"
                  disabled={isSubmitting}
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !content.trim()}
                  className="bg-green-500 hover:bg-green-600 text-black font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Teile...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Im Feed teilen
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
