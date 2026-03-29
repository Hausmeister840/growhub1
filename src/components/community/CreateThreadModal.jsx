import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, MessageCircle, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const THREAD_TYPES = [
  { value: 'discussion', label: 'Diskussion' },
  { value: 'grow_update', label: 'Grow Update' },
  { value: 'question', label: 'Frage' },
  { value: 'guide', label: 'Guide' },
];

export default function CreateThreadModal({ isOpen, onClose, spaceId, currentUser, onCreated }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('discussion');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Bitte gib einen Titel ein');
      return;
    }

    setLoading(true);
    try {
      await base44.entities.CommunityThread.create({
        space_id: spaceId,
        title: title.trim(),
        content: content.trim(),
        type,
        author_email: currentUser.email,
        reply_count: 0,
        view_count: 0,
        is_pinned: false,
        is_locked: false
      });

      // Update space post count
      const spaces = await base44.entities.CommunitySpace.filter({ id: spaceId });
      if (spaces && spaces.length > 0) {
        const space = spaces[0];
        await base44.entities.CommunitySpace.update(spaceId, {
          post_count: (space.post_count || 0) + 1,
          last_activity: new Date().toISOString()
        });
      }

      toast.success('Thread erstellt!');
      onCreated();
    } catch (err) {
      console.error('Create thread error:', err);
      toast.error('Fehler beim Erstellen');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-bold text-white">Thread erstellen</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Thread-Typ</label>
            <div className="flex gap-2 flex-wrap">
              {THREAD_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    type === t.value
                      ? 'bg-green-500 text-black'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Titel</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Worum geht es?"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500"
              maxLength={100}
            />
          </div>

          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Inhalt (optional)</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Details, Fragen, Beschreibung..."
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500 resize-none"
              rows={5}
              maxLength={2000}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !title.trim()}
            className="w-full py-3 bg-green-500 hover:bg-green-600 text-black font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Erstelle...' : (
              <>
                <Send className="w-4 h-4" />
                Thread erstellen
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}