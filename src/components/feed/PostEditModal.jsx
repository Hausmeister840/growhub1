import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function PostEditModal({ post, isOpen, onClose, onSaved }) {
  const [content, setContent] = useState(post?.content || '');
  const [tags, setTags] = useState(post?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !post) return null;

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error('Inhalt darf nicht leer sein');
      return;
    }

    setIsSaving(true);
    try {
      await base44.entities.Post.update(post.id, {
        content: content.trim(),
        tags: tags
      });
      
      toast.success('Post aktualisiert!');
      onSaved?.();
      onClose();
    } catch (error) {
      console.error('Edit error:', error);
      toast.error('Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, '');
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-2xl bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white">Post bearbeiten</h2>
          <Button onClick={onClose} variant="ghost" size="icon">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Was gibt's Neues?"
            className="min-h-[200px] bg-zinc-800/50 border-zinc-700"
            maxLength={5000}
          />

          <div className="text-xs text-zinc-500 text-right">
            {content.length} / 5000
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Hashtags</label>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <div key={tag} className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full">
                    <span className="text-sm text-green-400">#{tag}</span>
                    <button onClick={() => removeTag(tag)} className="text-green-400 hover:text-green-300">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Tag hinzufügen..."
                className="bg-zinc-800/50 border-zinc-700"
              />
              <Button onClick={addTag} variant="outline" className="border-zinc-700">
                Hinzufügen
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800 bg-zinc-900/50">
          <Button onClick={onClose} variant="outline" className="border-zinc-700">
            Abbrechen
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !content.trim()}
            className="bg-gradient-to-r from-green-500 to-emerald-600"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Speichert...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Speichern
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}